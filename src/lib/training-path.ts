import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Training ladder resolution — shared by /api/training/path, the guided
 * new-hire view (/api/training/guide), and the Mission Control new-hire
 * board, so every screen agrees on what someone's path is.
 *
 * Tracks: foundations + ongoing (everyone), department core (by onboarding
 * category), position track (restaurant-specific beats the global
 * skeleton), certifications (by category and optional positions).
 */

export const MANAGER_ROLES = ['admin', 'manager', 'assistant_manager'];
const PHOTO_TEST_PREFIX = '📸 Menu Photo Test';

interface TrackRow {
  id: string; restaurant_id: string | null;
  title: string; title_es: string | null;
  description: string | null; description_es: string | null;
  emoji: string | null; level: string; applies_to: string;
  position_slugs: string[]; sort_order: number;
}
interface ModuleRow {
  id: string; track_id: string; title: string; title_es: string | null;
  description: string | null; description_es: string | null;
  module_type: string; ref_id: string | null; completion: string;
  required: boolean; sort_order: number;
}

export interface ResolvedModule {
  id: string;
  title: string;
  title_es: string | null;
  description: string | null;
  description_es: string | null;
  module_type: string;
  ref_id: string | null;
  /** Study sections: which Training sub-tab the section lives in. */
  ref_zone: string | null;
  completion: string;
  required: boolean;
  sort_order: number;
  done: boolean;
  completed_at: string | null;
  /** Someone other than the person marked it (trainer or manager). */
  signed_off: boolean;
  available: boolean;
}

export interface ResolvedTrack {
  id: string;
  title: string;
  title_es: string | null;
  description: string | null;
  description_es: string | null;
  emoji: string | null;
  level: string;
  modules: ResolvedModule[];
  required_total: number;
  required_done: number;
  pct: number;
}

export interface FloorReadyStatus {
  /** A manager signed them off (the final step). */
  ready: boolean;
  /** Every required step is done — waiting on the manager's sign-off. */
  ready_for_signoff: boolean;
  via: 'signed_off' | 'override' | null;
  override: { granted_by_name: string | null; note: string | null; created_at: string } | null;
}

export interface ResolvedPath {
  user: {
    id: string;
    full_name: string;
    role: string;
    restaurant_id: string | null;
    onboarding_category: string | null;
    position_slug: string | null;
    hire_date: string | null;
  };
  tracks: ResolvedTrack[];
  floor_ready: FloorReadyStatus;
}

/** Resolve one person's training ladder with completion status. Pass the service-role client. */
export async function resolveTrainingPath(admin: SupabaseClient, targetId: string): Promise<ResolvedPath | null> {
  // One round trip for everything that only needs targetId (Sept 2026
  // load-time pass — this used to be ~7 queries in a row, and it sits
  // under Home on every open). Filtering happens in memory below; the
  // extra rows are tiny (a person's passed quizzes, one photo test per
  // restaurant, the few non-menu study sections).
  const [
    { data: target },
    { data: allTracks },
    { data: allModules },
    { data: progress },
    { data: passes },
    { data: photoQuizzes },
    { data: nonMenuCats },
    { data: override },
  ] = await Promise.all([
    admin
      .from('profiles')
      .select('id, full_name, role, restaurant_id, onboarding_category, position_slug, hire_date')
      .eq('id', targetId)
      .single(),
    admin.from('training_tracks').select('*').eq('active', true).order('sort_order'),
    admin.from('track_modules').select('*').eq('active', true).order('sort_order'),
    admin.from('module_progress').select('module_id, completed_at, manager_id').eq('user_id', targetId),
    admin.from('quiz_attempts').select('quiz_id').eq('user_id', targetId).eq('passed', true),
    admin.from('quizzes').select('id, active, restaurant_id').like('title', `${PHOTO_TEST_PREFIX}%`),
    // Sections not on the Menu (Systems, Manager Academy); anything missing is 'menu'.
    admin.from('menu_categories').select('id, zone').neq('zone', 'menu'),
    admin
      .from('floor_ready_overrides')
      .select('granted_by, note, created_at')
      .eq('user_id', targetId)
      .maybeSingle(),
  ]);
  if (!target) return null;

  const category: string | null = target.onboarding_category || null;
  const slug: string | null = target.position_slug || null;

  const tracks = (allTracks ?? []) as TrackRow[];
  const modules = (allModules ?? []) as ModuleRow[];

  const audienceMatch = (t: TrackRow) =>
    t.applies_to === 'all' || (category !== null && t.applies_to === category);

  const mine: TrackRow[] = [];
  for (const t of tracks) {
    if (t.restaurant_id && target.restaurant_id && t.restaurant_id !== target.restaurant_id) continue;
    if (t.level === 'foundations' || t.level === 'ongoing') { mine.push(t); continue; }
    if (t.level === 'department') { if (audienceMatch(t)) mine.push(t); continue; }
    if (t.level === 'position') {
      if (slug && t.position_slugs.includes(slug)) mine.push(t);
      continue;
    }
    if (t.level === 'certification') {
      if (!audienceMatch(t)) continue;
      if (t.position_slugs.length > 0 && (!slug || !t.position_slugs.includes(slug))) continue;
      mine.push(t);
    }
  }

  // Restaurant-specific position track beats the global skeleton.
  const positionTracks = mine.filter((t) => t.level === 'position');
  const hasSpecific = positionTracks.some((t) => t.restaurant_id !== null);
  const resolved = mine.filter((t) =>
    t.level !== 'position' || !hasSpecific || t.restaurant_id !== null
  );

  // ── Completion resolution ──
  const progressByModule = new Map((progress ?? []).map((p) => [p.module_id, p]));

  const passedQuizIds = new Set((passes ?? []).map((p) => p.quiz_id as string));

  // Photo test: passed ANY version of the restaurant's photo test.
  const myPhotoQuizzes = target.restaurant_id
    ? (photoQuizzes ?? []).filter((q) => q.restaurant_id === target.restaurant_id)
    : [];
  const photoTestExists = myPhotoQuizzes.some((q) => q.active);
  const photoTestPassed = myPhotoQuizzes.some((q) => passedQuizIds.has(q.id));

  // Which zone each study section lives in — Path buttons open Systems and
  // Manager Academy sections in the right place, not on the Menu.
  const zoneByCat = new Map<string, string>((nonMenuCats ?? []).map((c) => [c.id, c.zone]));

  const out: ResolvedTrack[] = resolved.map((t) => {
    const mods: ResolvedModule[] = modules
      .filter((m) => m.track_id === t.id)
      .map((m) => {
        const prog = progressByModule.get(m.id);
        const done =
          m.module_type === 'quiz' ? passedQuizIds.has(m.ref_id || '') :
          m.module_type === 'photo_test' ? photoTestPassed :
          !!prog;
        return {
          id: m.id,
          title: m.title,
          title_es: m.title_es,
          description: m.description,
          description_es: m.description_es,
          module_type: m.module_type,
          ref_id: m.ref_id,
          ref_zone: m.module_type === 'menu_category' && m.ref_id ? zoneByCat.get(m.ref_id) ?? 'menu' : null,
          completion: m.completion,
          required: m.required,
          sort_order: m.sort_order,
          done,
          completed_at: prog?.completed_at ?? null,
          signed_off: !!prog?.manager_id,
          // Photo test module with no live test yet — the UI can say so.
          available: m.module_type !== 'photo_test' || photoTestExists,
        };
      });
    const req = mods.filter((m) => m.required);
    const doneCount = req.filter((m) => m.done).length;
    return {
      id: t.id,
      title: t.title,
      title_es: t.title_es,
      description: t.description,
      description_es: t.description_es,
      emoji: t.emoji,
      level: t.level,
      modules: mods,
      required_total: req.length,
      required_done: doneCount,
      pct: req.length === 0 ? 0 : Math.round((doneCount / req.length) * 100),
    };
  });

  const levelOrder = ['foundations', 'department', 'position', 'certification', 'ongoing'];
  out.sort((a, b) => levelOrder.indexOf(a.level) - levelOrder.indexOf(b.level) || a.title.localeCompare(b.title));

  // ── Floor-ready ──
  // Finishing every required step (Ongoing Growth never counts) makes
  // someone ready for sign-off; a manager's sign-off makes them floor-ready.
  // A manager can also sign someone off early as a judgment call ("override").
  const gating = out.filter((t) => t.level !== 'ongoing');
  const requiredTotal = gating.reduce((n, t) => n + t.required_total, 0);
  const requiredDone = gating.reduce((n, t) => n + t.required_done, 0);
  const completedAll = requiredTotal > 0 && requiredDone === requiredTotal;

  let grantedByName: string | null = null;
  if (override) {
    const { data: granter } = await admin
      .from('profiles').select('full_name').eq('id', override.granted_by).maybeSingle();
    grantedByName = granter?.full_name ?? null;
  }

  return {
    user: {
      id: target.id,
      full_name: target.full_name,
      role: target.role,
      restaurant_id: target.restaurant_id,
      onboarding_category: category,
      position_slug: slug,
      hire_date: target.hire_date,
    },
    tracks: out,
    floor_ready: {
      ready: !!override,
      ready_for_signoff: completedAll && !override,
      via: override ? (completedAll ? 'signed_off' : 'override') : null,
      override: override
        ? { granted_by_name: grantedByName, note: override.note, created_at: override.created_at }
        : null,
    },
  };
}

/** True when trainerId is the assigned trainer for traineeId (false before migration 081). */
export async function isAssignedTrainer(admin: SupabaseClient, trainerId: string, traineeId: string): Promise<boolean> {
  const { data, error } = await admin
    .from('trainee_assignments')
    .select('user_id')
    .eq('user_id', traineeId)
    .eq('trainer_id', trainerId)
    .maybeSingle();
  return !error && !!data;
}
