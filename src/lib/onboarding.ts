import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Onboarding checklist data layer.
 *
 * One employee's checklist is the join of:
 *   • onboarding_checklist_items filtered by their restaurant + category
 *   • onboarding_checklist_links for each item
 *   • their employee_onboarding_progress rows (dual-check state)
 *   • derived auto-check state from policy signatures, Our Story ack,
 *     bar card upload, and welcome dismissal.
 *
 * Auto-tracking checks the EMPLOYEE column only — the manager still has
 * to physically check the manager column to confirm they verified.
 */

export type OnboardingSection = 'paperwork' | 'training' | 'first_week' | 'ongoing';
export type OnboardingCategory = 'foh' | 'boh' | 'mgmt';
export type AppliesTo = 'all' | OnboardingCategory;

export type AutoTrackSource =
  | 'policy_signatures_any'
  | 'policy_signatures_all'
  | 'handbook_signed'
  | 'our_story_ack'
  | 'bar_card_uploaded'
  | 'welcome_dismissed';

export type LinkType = 'telegram' | 'app_store' | 'play_store' | 'web' | 'video' | 'pdf';

export interface OnboardingLink {
  id: string;
  label: string;
  url: string;
  link_type: LinkType;
  sort_order: number;
}

export interface OnboardingItemWithStatus {
  id: string;
  section: OnboardingSection;
  sort_order: number;
  restaurant_id: string | null;
  applies_to: AppliesTo;
  title: string;
  description: string | null;
  /** Extra instructions only shown when a manager is viewing the hire's checklist. */
  manager_instructions: string | null;
  auto_track_source: AutoTrackSource | null;
  requires_employee_check: boolean;
  requires_manager_check: boolean;
  links: OnboardingLink[];

  // Progress state (merged from progress row + auto-track derivation).
  employee_checked_at: string | null;
  manager_checked_at: string | null;
  manager_id: string | null;
  auto_checked: boolean;     // true if employee_checked_at came from auto-track, not a manual tap
  is_complete: boolean;       // both columns checked (or only the required ones)
}

export interface OnboardingProgressSummary {
  total: number;
  employee_checked: number;
  manager_checked: number;
  fully_complete: number;
  pct_complete: number;       // 0–100
}

export interface OnboardingForUser {
  user_id: string;
  full_name: string;
  restaurant_id: string | null;
  restaurant_name: string | null;
  onboarding_category: OnboardingCategory | null;
  hire_date: string | null;
  welcome_until: string | null;
  items: OnboardingItemWithStatus[];
  progress: OnboardingProgressSummary;
}

/**
 * Load and merge everything needed to render one user's onboarding view.
 *
 * Pass a supabase client with read access to:
 *   profiles, restaurants, onboarding_checklist_items, onboarding_checklist_links,
 *   employee_onboarding_progress, policy_signatures, policies, bar_cards.
 *
 * For the "current user reading their own" case, the regular request-bound
 * client works (RLS allows). For the manager-view case, pass an admin
 * client so all cross-user reads succeed.
 */
export async function getOnboardingForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<OnboardingForUser | null> {
  // 1) Profile (needed to scope items). Single round trip.
  const { data: profileRaw } = await supabase
    .from('profiles')
    .select(
      'id, full_name, restaurant_id, onboarding_category, position_slug, hire_date, welcome_until, welcome_dismissed_at, story_acknowledged_at, restaurants(id, name)'
    )
    .eq('id', userId)
    .single();

  if (!profileRaw) return null;

  // Normalize the embedded "restaurants" join — Supabase typegen treats single
  // FK joins as arrays.
  const profileAny = profileRaw as unknown as {
    id: string;
    full_name: string;
    restaurant_id: string | null;
    onboarding_category: OnboardingCategory | null;
    position_slug: string | null;
    hire_date: string | null;
    welcome_until: string | null;
    welcome_dismissed_at: string | null;
    story_acknowledged_at: string | null;
    restaurants: { id: string; name: string } | { id: string; name: string }[] | null;
  };
  const profile = {
    ...profileAny,
    restaurants: Array.isArray(profileAny.restaurants) ? (profileAny.restaurants[0] ?? null) : profileAny.restaurants,
  };

  // 2) Fan out all independent queries in parallel. These don't depend on each
  //    other — only on the profile we just loaded. Previously these ran serial,
  //    costing ~5 round trips of latency. Now they collapse to 1.
  //
  //    auto-track queries (policy_signatures, active policies, bar_cards) are
  //    always fired here rather than gated on `sources.has(...)` — the items
  //    fetch and these can't be sequenced without losing the parallelism, and
  //    the auto-track queries are tiny.
  const allowedApplies: AppliesTo[] = profile.onboarding_category
    ? ['all', profile.onboarding_category]
    : ['all'];

  let itemQuery = supabase
    .from('onboarding_checklist_items')
    .select('id, section, sort_order, restaurant_id, applies_to, title, description, manager_instructions, auto_track_source, requires_employee_check, requires_manager_check')
    .eq('active', true)
    .in('applies_to', allowedApplies)
    .order('section', { ascending: true })
    .order('sort_order', { ascending: true });
  if (profile.restaurant_id) {
    itemQuery = itemQuery.or(`restaurant_id.is.null,restaurant_id.eq.${profile.restaurant_id}`);
  } else {
    itemQuery = itemQuery.is('restaurant_id', null);
  }

  const [itemsRes, sigsRes, policiesRes, barCardsRes] = await Promise.all([
    itemQuery,
    supabase
      .from('policy_signatures')
      .select('policy_id, signed_at, policies(kind)')
      .eq('user_id', userId),
    supabase
      .from('policies')
      .select('id, restaurant_id')
      .eq('active', true)
      .eq('kind', 'policy'),
    supabase
      .from('bar_cards')
      .select('created_at')
      .eq('profile_id', userId)
      .order('created_at', { ascending: true })
      .limit(1),
  ]);

  const items = (itemsRes.data ?? []) as Array<{
    id: string;
    section: OnboardingSection;
    sort_order: number;
    restaurant_id: string | null;
    applies_to: AppliesTo;
    title: string;
    description: string | null;
    manager_instructions: string | null;
    auto_track_source: AutoTrackSource | null;
    requires_employee_check: boolean;
    requires_manager_check: boolean;
  }>;

  const itemIds = items.map((i) => i.id);

  // 3) Items-dependent queries (links, progress). Both can be fetched in
  //    parallel against the just-loaded item IDs.
  const [linksRes, progressRes] = itemIds.length
    ? await Promise.all([
        supabase
          .from('onboarding_checklist_links')
          .select('id, item_id, label, url, link_type, applies_to, position_slugs, sort_order')
          .in('item_id', itemIds)
          .order('sort_order', { ascending: true }),
        supabase
          .from('employee_onboarding_progress')
          .select('item_id, employee_checked_at, manager_checked_at, manager_id')
          .eq('user_id', userId)
          .in('item_id', itemIds),
      ])
    : [
        { data: [] as Array<{ id: string; item_id: string; label: string; url: string; link_type: LinkType; applies_to: string; sort_order: number }> },
        { data: [] as Array<{ item_id: string; employee_checked_at: string | null; manager_checked_at: string | null; manager_id: string | null }> },
      ];

  // Filter links by the user's onboarding category AND optional position.
  //   • applies_to='all' shows to everyone; foh/boh/mgmt show to matching
  //     category only (or empty if user category not set).
  //   • position_slugs (text[]) further narrows by exact position match.
  //     If position_slugs is null/empty, no position filter applied.
  //     If non-empty AND user has no position_slug, link is hidden.
  const allowedLinkApplies = new Set<string>(
    profile.onboarding_category ? ['all', profile.onboarding_category] : ['all']
  );

  const links = ((linksRes.data ?? []) as Array<{
    id: string;
    item_id: string;
    label: string;
    url: string;
    link_type: LinkType;
    applies_to?: string;
    position_slugs?: string[] | null;
    sort_order: number;
  }>).filter((l) => {
    if (!allowedLinkApplies.has(l.applies_to ?? 'all')) return false;
    const slugs = l.position_slugs;
    if (slugs && slugs.length > 0) {
      if (!profile.position_slug) return false;
      if (!slugs.includes(profile.position_slug)) return false;
    }
    return true;
  });
  const linksByItem = new Map<string, OnboardingLink[]>();
  for (const l of links) {
    const arr = linksByItem.get(l.item_id) ?? [];
    arr.push({ id: l.id, label: l.label, url: l.url, link_type: l.link_type, sort_order: l.sort_order });
    linksByItem.set(l.item_id, arr);
  }

  const progress = (progressRes.data ?? []) as Array<{
    item_id: string;
    employee_checked_at: string | null;
    manager_checked_at: string | null;
    manager_id: string | null;
  }>;
  const progressByItem = new Map<string, typeof progress[number]>();
  for (const p of progress) progressByItem.set(p.item_id, p);

  // 4) Compute auto-track evidence from the queries already done.
  const sources = new Set(items.map((i) => i.auto_track_source).filter(Boolean) as AutoTrackSource[]);

  let handbookSignedAt: string | null = null;
  let policiesAllSignedAt: string | null = null;
  let policiesAnySignedAt: string | null = null;
  let barCardUploadedAt: string | null = null;

  if (sources.has('handbook_signed') || sources.has('policy_signatures_all') || sources.has('policy_signatures_any')) {
    // Supabase typegen returns the joined "policies" as an array even though
    // it's a single FK — normalize.
    const sigRows = ((sigsRes.data ?? []) as unknown as Array<{
      policy_id: string;
      signed_at: string;
      policies: { kind: 'handbook' | 'policy' } | { kind: 'handbook' | 'policy' }[] | null;
    }>).map((s) => ({
      policy_id: s.policy_id,
      signed_at: s.signed_at,
      policies: Array.isArray(s.policies) ? (s.policies[0] ?? null) : s.policies,
    }));

    const handbookSig = sigRows.find((s) => s.policies?.kind === 'handbook');
    handbookSignedAt = handbookSig?.signed_at ?? null;
    const anyPolicy = sigRows.find((s) => s.policies?.kind === 'policy');
    policiesAnySignedAt = anyPolicy?.signed_at ?? null;

    if (sources.has('policy_signatures_all')) {
      const applicablePolicies = (policiesRes.data ?? []).filter((p) => {
        const r = (p as { restaurant_id: string | null }).restaurant_id;
        return r === null || r === profile.restaurant_id;
      });
      const signedPolicyIds = new Set(sigRows.filter((s) => s.policies?.kind === 'policy').map((s) => s.policy_id));
      const allSigned = applicablePolicies.length > 0 && applicablePolicies.every((p) => signedPolicyIds.has((p as { id: string }).id));
      if (allSigned) {
        const policyTimestamps = sigRows
          .filter((s) => s.policies?.kind === 'policy')
          .map((s) => s.signed_at)
          .sort();
        policiesAllSignedAt = policyTimestamps[policyTimestamps.length - 1] ?? null;
      }
    }
  }

  if (sources.has('bar_card_uploaded')) {
    barCardUploadedAt = (barCardsRes.data?.[0] as { created_at?: string } | undefined)?.created_at ?? null;
  }

  // welcome_dismissed_at and story_acknowledged_at come from the profile directly.
  const welcomeDismissedAt = profile.welcome_dismissed_at ?? null;
  const storyAckAt = profile.story_acknowledged_at ?? null;

  function autoCheckTime(source: AutoTrackSource | null): string | null {
    switch (source) {
      case 'handbook_signed': return handbookSignedAt;
      case 'policy_signatures_any': return policiesAnySignedAt;
      case 'policy_signatures_all': return policiesAllSignedAt;
      case 'our_story_ack': return storyAckAt;
      case 'bar_card_uploaded': return barCardUploadedAt;
      case 'welcome_dismissed': return welcomeDismissedAt;
      default: return null;
    }
  }

  // 6) Merge — build the final item list with status
  // Some auto-track sources represent MANAGER actions (e.g. a manager
  // uploading a bar card). Those should auto-check both columns because
  // the upload IS the verification. Sources that represent EMPLOYEE
  // actions (signing policies, acknowledging Our Story) only fill the
  // employee column — the manager still confirms separately.
  const managerSideSources = new Set<AutoTrackSource>(['bar_card_uploaded']);

  const merged: OnboardingItemWithStatus[] = items.map((item) => {
    const prog = progressByItem.get(item.id);
    const autoTime = autoCheckTime(item.auto_track_source);
    const autoIsManagerSide = item.auto_track_source && managerSideSources.has(item.auto_track_source);
    const employee_checked_at = prog?.employee_checked_at ?? autoTime ?? null;
    const manager_checked_at = prog?.manager_checked_at
      ?? (autoIsManagerSide ? autoTime : null);
    const is_complete =
      (!item.requires_employee_check || !!employee_checked_at) &&
      (!item.requires_manager_check || !!manager_checked_at);
    return {
      id: item.id,
      section: item.section,
      sort_order: item.sort_order,
      restaurant_id: item.restaurant_id,
      applies_to: item.applies_to,
      title: item.title,
      description: item.description,
      manager_instructions: item.manager_instructions,
      auto_track_source: item.auto_track_source,
      requires_employee_check: item.requires_employee_check,
      requires_manager_check: item.requires_manager_check,
      links: linksByItem.get(item.id) ?? [],
      employee_checked_at,
      manager_checked_at,
      manager_id: prog?.manager_id ?? null,
      auto_checked: !prog?.employee_checked_at && !!autoTime,
      is_complete,
    };
  });

  // 7) Summary
  const total = merged.length;
  const employee_checked = merged.filter((i) => !!i.employee_checked_at).length;
  const manager_checked = merged.filter((i) => !!i.manager_checked_at).length;
  const fully_complete = merged.filter((i) => i.is_complete).length;
  const pct_complete = total === 0 ? 0 : Math.round((fully_complete / total) * 100);

  return {
    user_id: profile.id,
    full_name: profile.full_name,
    restaurant_id: profile.restaurant_id,
    restaurant_name: profile.restaurants?.name ?? null,
    onboarding_category: profile.onboarding_category,
    hire_date: profile.hire_date,
    welcome_until: profile.welcome_until,
    items: merged,
    progress: {
      total,
      employee_checked,
      manager_checked,
      fully_complete,
      pct_complete,
    },
  };
}
