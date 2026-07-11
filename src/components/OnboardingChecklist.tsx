'use client';

import { useEffect, useState, useCallback } from 'react';

/* ───────── Types ───────── */
type OnboardingSection = 'paperwork' | 'training' | 'first_week' | 'ongoing';
type OnboardingCategory = 'foh' | 'boh' | 'mgmt';

type LinkType = 'telegram' | 'app_store' | 'play_store' | 'web' | 'video' | 'pdf';

interface OnboardingLink {
  id: string;
  label: string;
  url: string;
  link_type: LinkType;
  sort_order: number;
}

interface OnboardingItem {
  id: string;
  section: OnboardingSection;
  sort_order: number;
  applies_to: 'all' | OnboardingCategory;
  title: string;
  description: string | null;
  manager_instructions: string | null;
  auto_track_source: string | null;
  requires_employee_check: boolean;
  requires_manager_check: boolean;
  links: OnboardingLink[];
  employee_checked_at: string | null;
  manager_checked_at: string | null;
  manager_id: string | null;
  auto_checked: boolean;
  is_complete: boolean;
}

interface OnboardingData {
  user_id: string;
  full_name: string;
  restaurant_id: string | null;
  restaurant_name: string | null;
  onboarding_category: OnboardingCategory | null;
  hire_date: string | null;
  welcome_until: string | null;
  items: OnboardingItem[];
  progress: {
    total: number;
    employee_checked: number;
    manager_checked: number;
    fully_complete: number;
    pct_complete: number;
  };
}

interface Props {
  /** "me" → employee viewing own; "/api/onboarding/users/[id]" → manager viewing other */
  endpoint: string;
  /** Manager mode — adds category picker + lets manager toggle the manager column. */
  managerMode?: boolean;
  /** ID of the user being viewed, used by manager-mode toggles. */
  targetUserId?: string;
  /** Compact mode — used on HomeTab to keep it tighter. */
  compact?: boolean;
  /** Self-render the "Your Onboarding" heading. Compact + non-manager use only. */
  showHeading?: boolean;
  /**
   * Called when the user taps an action button on an auto-tracked item
   * (Sign Handbook, Upload Bar Card, etc.). The parent should navigate
   * the user to the right surface. Receives:
   *   • action: 'sign_handbook' | 'sign_policies' | 'upload_bar_card' | 'acknowledge_story'
   *   • detail (optional) — e.g. the handbook policy id for deep-linking
   */
  onAction?: (action: string, detail?: string) => void;
  /** UI language. Defaults to English. */
  language?: 'en' | 'es';
}

const SECTION_LABEL: Record<OnboardingSection, { en: string; es: string; emoji: string }> = {
  paperwork: { en: 'Paperwork & Setup', es: 'Papeleo y Preparación', emoji: '📋' },
  training: { en: 'Training', es: 'Capacitación', emoji: '🎓' },
  first_week: { en: 'First Week', es: 'Primera Semana', emoji: '🚪' },
  ongoing: { en: 'Ongoing', es: 'Continuo', emoji: '📈' },
};

/* UI strings — follows the PoliciesTab isES pattern. Manager-facing strings
 * stay English (manager surfaces don't pass a language yet). */
const UI = {
  en: {
    loading: 'Loading checklist…',
    headerLabel: 'Onboarding Checklist',
    yourTitle: 'Your first few weeks',
    complete: 'complete',
    doneCount: (done: number, total: number) => `${done}/${total} done`,
    yourProgress: (done: number, total: number) =>
      done === 0
        ? `${total} steps — take them one at a time. Your manager confirms each one behind you.`
        : `You've knocked out ${done} of ${total} — keep it rolling. Your manager confirms each one behind you.`,
    allDoneTitle: (name: string) => `You're all set${name ? `, ${name}` : ''}! 🎉`,
    allDoneBody: 'Every item is checked and confirmed. You put in the work — now go be great out there.',
    badgeDone: 'Done',
    badgeInProgress: 'In progress',
    badgeUpNext: 'Up next',
    readMore: 'Read more →',
    showLess: 'Show less',
    view: 'View',
    collapse: 'Collapse',
    you: 'You',
    manager: 'Manager',
    employee: 'Employee',
    signHandbook: '✍️ Sign Handbook',
    signPolicies: '✍️ Sign Policies',
    readAcknowledge: '📖 Read & Acknowledge',
  },
  es: {
    loading: 'Cargando lista…',
    headerLabel: 'Lista de Bienvenida',
    yourTitle: 'Tus primeras semanas',
    complete: 'completado',
    doneCount: (done: number, total: number) => `${done}/${total} listos`,
    yourProgress: (done: number, total: number) =>
      done === 0
        ? `${total} pasos — tómalos uno a la vez. Tu gerente confirma cada uno detrás de ti.`
        : `Ya completaste ${done} de ${total} — sigue así. Tu gerente confirma cada uno detrás de ti.`,
    allDoneTitle: (name: string) => `¡Todo listo${name ? `, ${name}` : ''}! 🎉`,
    allDoneBody: 'Cada paso está marcado y confirmado. Hiciste el trabajo — ahora sal y demuestra de qué estás hecho.',
    badgeDone: 'Listo',
    badgeInProgress: 'En progreso',
    badgeUpNext: 'Siguiente',
    readMore: 'Leer más →',
    showLess: 'Ver menos',
    view: 'Ver',
    collapse: 'Cerrar',
    you: 'Tú',
    manager: 'Gerente',
    employee: 'Empleado',
    signHandbook: '✍️ Firmar el Manual',
    signPolicies: '✍️ Firmar Políticas',
    readAcknowledge: '📖 Leer y Confirmar',
  },
} as const;

type UIStrings = (typeof UI)['en'] | (typeof UI)['es'];

const LINK_ICON: Record<LinkType, string> = {
  telegram: '💬',
  app_store: '',
  play_store: '▶',
  web: '🌐',
  video: '▶︎',
  pdf: '📄',
};

const LINK_TYPE_BG: Record<LinkType, string> = {
  telegram: 'bg-sky-50 border-sky-200 text-sky-800 hover:bg-sky-100',
  app_store: 'bg-gray-900 border-gray-900 text-white hover:bg-black',
  play_store: 'bg-emerald-600 border-emerald-700 text-white hover:bg-emerald-700',
  web: 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100',
  video: 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100',
  pdf: 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100',
};

/* ───────── Main widget ───────── */
export default function OnboardingChecklist({ endpoint, managerMode = false, targetUserId, compact = false, showHeading = false, onAction, language = 'en' }: Props) {
  const t: UIStrings = UI[language] ?? UI.en;
  const [data, setData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Set<OnboardingSection>>(() => new Set<OnboardingSection>(['paperwork']));
  const [expandedItemIds, setExpandedItemIds] = useState<Set<string>>(() => new Set<string>());
  const [savingCategory, setSavingCategory] = useState(false);

  const toggleItemExpand = useCallback((id: string) => {
    setExpandedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // silent = refresh data in place after a toggle. No full-screen loading
  // state, no accordion reset — the user keeps their place and momentum.
  // The non-silent path (initial mount) still shows the loader and opens
  // the first incomplete section.
  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = !!opts?.silent;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch(endpoint, { cache: 'no-store' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Failed to load onboarding checklist');
      }
      const j: OnboardingData = await res.json();
      setData(j);
      if (!silent) {
        // Auto-open the first section with an incomplete item
        const firstIncomplete = (['paperwork', 'training', 'first_week', 'ongoing'] as OnboardingSection[])
          .find((sec) => j.items.some((i) => i.section === sec && !i.is_complete));
        if (firstIncomplete) setOpenSections(new Set<OnboardingSection>([firstIncomplete]));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => { load(); }, [load]);

  async function toggleCheck(itemId: string, column: 'employee' | 'manager', currentlyChecked: boolean) {
    if (!data) return;
    // Optimistic UI
    const nowIso = new Date().toISOString();
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((it) => {
          if (it.id !== itemId) return it;
          const next = { ...it };
          if (column === 'employee') next.employee_checked_at = currentlyChecked ? null : nowIso;
          else next.manager_checked_at = currentlyChecked ? null : nowIso;
          next.is_complete =
            (!next.requires_employee_check || !!next.employee_checked_at) &&
            (!next.requires_manager_check || !!next.manager_checked_at);
          // Clear auto_checked flag when a real toggle happens
          if (column === 'employee') next.auto_checked = false;
          return next;
        }),
      };
    });

    try {
      const res = await fetch('/api/onboarding/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: targetUserId,
          item_id: itemId,
          column,
          checked: !currentlyChecked,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Failed to update');
      }
      // Quietly refresh so progress stats and timestamps come back accurate
      load({ silent: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update');
      load({ silent: true });
    }
  }

  async function setCategory(category: OnboardingCategory) {
    if (!targetUserId) return;
    setSavingCategory(true);
    try {
      const res = await fetch(`/api/admin/users/${targetUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboarding_category: category }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Failed to set category');
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to set category');
    } finally {
      setSavingCategory(false);
    }
  }

  if (loading) {
    // Don't render anything in compact + heading mode while loading — avoids
    // a flash of empty heading on HomeTab.
    if (compact && showHeading) return null;
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
        <div className="text-gray-400 text-sm animate-pulse">{t.loading}</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }
  if (!data) return null;

  // Self-hide on HomeTab once the user has fully completed onboarding.
  // Managers always see the widget (they may need to confirm items).
  if (compact && !managerMode && data.progress.pct_complete === 100) return null;

  const sections: OnboardingSection[] = ['paperwork', 'training', 'first_week', 'ongoing'];
  const isAllDone = data.progress.pct_complete === 100;
  const firstName = (data.full_name || '').split(' ')[0];

  return (
    <div className="space-y-3">
      {showHeading && (
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
          <span className="text-base">✅</span>
          Your Onboarding
          <span className="ml-auto text-[11px] font-normal text-gray-500 normal-case tracking-normal">
            {t.doneCount(data.progress.fully_complete, data.progress.total)}
          </span>
        </h2>
      )}

      {/* 100% celebration — the finish line deserves better than a widget
          quietly disappearing. Employee view only; managers keep the stats. */}
      {isAllDone && !managerMode && (
        <div className="rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-[3px] shadow-xl shadow-emerald-300/40">
          <div className="rounded-[22px] bg-gradient-to-br from-emerald-50 to-teal-50 px-6 py-7 text-center relative overflow-hidden">
            <div className="absolute -top-2 -left-2 text-2xl opacity-60 select-none" aria-hidden>🎊</div>
            <div className="absolute -top-2 -right-2 text-2xl opacity-60 select-none" aria-hidden>✨</div>
            <div className="text-5xl mb-2" aria-hidden>🏆</div>
            <h2 className="text-xl md:text-2xl font-extrabold text-emerald-900">
              {t.allDoneTitle(firstName)}
            </h2>
            <p className="text-sm text-emerald-800 mt-2 leading-relaxed">{t.allDoneBody}</p>
          </div>
        </div>
      )}

      {/* Header / progress */}
      <div className={`bg-white rounded-2xl shadow-sm ${compact ? 'p-4' : 'p-5'}`}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{t.headerLabel}</p>
            <h2 className="text-base md:text-lg font-bold text-[#1B3A6B] truncate">
              {managerMode ? data.full_name : t.yourTitle}
            </h2>
            {managerMode && (
              <p className="text-xs text-gray-500 mt-0.5">
                {data.restaurant_name ?? 'No restaurant'}
                {data.onboarding_category ? ` · ${data.onboarding_category.toUpperCase()}` : ' · category not set'}
                {data.hire_date && ` · Hired ${new Date(data.hire_date).toLocaleDateString()}`}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-bold text-[#1B3A6B]">{data.progress.pct_complete}%</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">{t.complete}</div>
          </div>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all ${data.progress.pct_complete === 100 ? 'bg-green-500' : 'bg-[#1B3A6B]'}`}
            style={{ width: `${data.progress.pct_complete}%` }}
          />
        </div>
        <p className="text-[11px] text-gray-500 mt-2">
          {managerMode
            ? `${data.progress.fully_complete} of ${data.progress.total} items fully complete · ${data.progress.employee_checked} checked by employee · ${data.progress.manager_checked} confirmed by manager`
            : t.yourProgress(data.progress.fully_complete, data.progress.total)}
        </p>

        {/* Manager: category picker if not set */}
        {managerMode && !data.onboarding_category && (
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-amber-800 mb-2">
              Set this hire&rsquo;s category so the right items appear.
            </p>
            <div className="flex gap-2">
              {(['foh', 'boh', 'mgmt'] as OnboardingCategory[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  disabled={savingCategory}
                  className="flex-1 px-3 py-2 text-xs font-semibold rounded-md bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 disabled:opacity-50"
                >
                  {c === 'foh' ? 'Front of House' : c === 'boh' ? 'Back of House' : 'Management'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Manager: category change (if already set) */}
        {managerMode && data.onboarding_category && (
          <div className="mt-3 flex items-center gap-2 text-[11px]">
            <span className="text-gray-500">Change category:</span>
            {(['foh', 'boh', 'mgmt'] as OnboardingCategory[]).map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                disabled={savingCategory || data.onboarding_category === c}
                className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold ${
                  data.onboarding_category === c
                    ? 'bg-[#1B3A6B] text-white border-[#1B3A6B]'
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                } disabled:opacity-50`}
              >
                {c.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sections — each renders a sticky header followed by item cards */}
      {sections.map((sec) => {
        const sectionItems = data.items.filter((i) => i.section === sec);
        if (sectionItems.length === 0) return null;
        const isOpen = openSections.has(sec);
        const done = sectionItems.filter((i) => i.is_complete).length;
        const total = sectionItems.length;
        const pct = total === 0 ? 0 : Math.round((done / total) * 100);
        const sectionComplete = pct === 100;

        return (
          <section key={sec} className="space-y-2">
            {/* Sticky section header — navy band stays visible while
                scrolling through its items so the user always knows
                what phase they're in. */}
            <button
              onClick={() =>
                setOpenSections((prev) => {
                  const next = new Set(prev);
                  if (next.has(sec)) next.delete(sec);
                  else next.add(sec);
                  return next;
                })
              }
              className={`w-full sticky top-0 z-10 rounded-xl shadow-md px-4 py-3 flex items-center justify-between transition-colors ${
                sectionComplete
                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  : 'bg-[#1B3A6B] hover:bg-[#2C4F8A] text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg">{SECTION_LABEL[sec].emoji}</span>
                <div className="text-left min-w-0">
                  <div className="font-bold text-sm truncate">{language === 'es' ? SECTION_LABEL[sec].es : SECTION_LABEL[sec].en}</div>
                  <div className="text-[10px] text-white/60 uppercase tracking-widest mt-0.5">
                    {done}/{total} done · {pct}%
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {sectionComplete && <span className="text-emerald-300 text-base">✓</span>}
                <span className={`text-white/70 transition-transform text-lg ${isOpen ? 'rotate-90' : ''}`}>›</span>
              </div>
            </button>

            {/* Item cards — each is its own visual unit with a colored
                status stripe on the left, breathing room between them. */}
            {isOpen && sectionItems.map((item, idx) => (
              <ItemCard
                key={item.id}
                item={item}
                stepNumber={idx + 1}
                onToggle={toggleCheck}
                onAction={onAction}
                managerMode={managerMode}
                isExpanded={expandedItemIds.has(item.id)}
                onToggleExpand={() => toggleItemExpand(item.id)}
                t={t}
              />
            ))}
          </section>
        );
      })}
    </div>
  );
}

/** Maps an item's auto_track_source to a primary action button.
 *  Returns null for items that don't need a user-triggered action.
 *  bar_card_uploaded is deliberately omitted — bar cards are uploaded by a
 *  manager via the admin Bar Cards tab (compliance requires a manager to
 *  physically verify the original card), not by the employee themselves. */
function actionForSource(source: string | null, t: UIStrings): { key: string; label: string } | null {
  switch (source) {
    case 'handbook_signed': return { key: 'sign_handbook', label: t.signHandbook };
    case 'policy_signatures_all':
    case 'policy_signatures_any': return { key: 'sign_policies', label: t.signPolicies };
    case 'our_story_ack': return { key: 'acknowledge_story', label: t.readAcknowledge };
    default: return null;
  }
}

/** Truncate text at a sentence/word boundary near maxLen for the
 *  description preview. Tries to break at "." then " " then hard. */
function truncatePreview(text: string, maxLen = 110): string {
  if (text.length <= maxLen) return text;
  const window = text.slice(0, maxLen);
  // Prefer a sentence boundary
  const lastPeriod = window.lastIndexOf('.');
  if (lastPeriod > maxLen - 40) return window.slice(0, lastPeriod + 1).trim();
  // Fall back to a word boundary
  const lastSpace = window.lastIndexOf(' ');
  if (lastSpace > 0) return window.slice(0, lastSpace).trim() + '…';
  return window + '…';
}

/* ───────── Item card ─────────
 * Each checklist item renders as its own card with:
 *   • A 4px colored left stripe (gray/amber/emerald) showing status
 *   • Step number + title + status badge in the header
 *   • Description that auto-truncates if > 80 chars (Read more / Show less)
 *   • Inline action links (always visible — these are the work surface)
 *   • Manager instructions (collapsible amber box, manager view only)
 *   • Dual-check pills OR a primary action button in the footer
 *
 * Completed items auto-collapse to a single-line summary; tap "View" to
 * re-expand. Long-description items start with the description collapsed
 * but everything else visible.
 */
function ItemCard({
  item,
  stepNumber,
  onToggle,
  onAction,
  managerMode,
  isExpanded,
  onToggleExpand,
  t,
}: {
  item: OnboardingItem;
  stepNumber: number;
  onToggle: (itemId: string, column: 'employee' | 'manager', currentlyChecked: boolean) => void;
  onAction?: (action: string, detail?: string) => void;
  managerMode: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  t: UIStrings;
}) {
  const employeeChecked = !!item.employee_checked_at;
  const managerChecked = !!item.manager_checked_at;
  const isComplete = item.is_complete;

  // Status drives the left-edge stripe.
  const stripeClass = isComplete
    ? 'bg-emerald-500'
    : (employeeChecked || managerChecked)
    ? 'bg-amber-400'
    : 'bg-gray-200';

  const description = item.description ?? '';
  const isLongDesc = description.length > 80;
  // Completed items collapse fully (just title + checkmark) until tapped.
  const isCompact = isComplete && !isExpanded;

  // ── Compact mode for completed items ──
  if (isCompact) {
    return (
      <div className="flex items-stretch bg-white rounded-xl shadow-sm overflow-hidden">
        <div className={`w-1 ${stripeClass}`} />
        <button
          onClick={onToggleExpand}
          className="flex-1 flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-emerald-500 text-sm shrink-0" aria-hidden>✓</span>
            <span className="text-[10px] font-bold text-gray-400 shrink-0">#{stepNumber}</span>
            <span className="text-xs font-semibold text-gray-700 truncate">{item.title}</span>
          </div>
          <span className="text-[10px] text-gray-400 shrink-0 font-semibold">{t.view}</span>
        </button>
      </div>
    );
  }

  // ── Full card ──
  const action = !employeeChecked && onAction ? actionForSource(item.auto_track_source, t) : null;
  const canToggleManager = managerMode;
  const showDescTruncated = isLongDesc && !isExpanded;

  // Status badge
  const badge = isComplete
    ? { text: t.badgeDone, cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
    : (employeeChecked || managerChecked)
    ? { text: t.badgeInProgress, cls: 'bg-amber-100 text-amber-800 border-amber-200' }
    : { text: t.badgeUpNext, cls: 'bg-gray-100 text-gray-600 border-gray-200' };

  return (
    <div className="flex items-stretch bg-white rounded-xl shadow-sm overflow-hidden">
      <div className={`w-1 ${stripeClass}`} />
      <div className="flex-1 p-4 min-w-0">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className="text-[10px] font-bold text-gray-400 shrink-0">#{stepNumber}</span>
            <h3 className="text-sm font-semibold text-gray-800 leading-snug">{item.title}</h3>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0 font-semibold ${badge.cls}`}>
            {badge.text}
          </span>
        </div>

        {/* Description */}
        {description && (
          <div className="text-xs text-gray-600 mt-1.5 leading-relaxed whitespace-pre-wrap">
            {showDescTruncated ? (
              <>
                {renderBoldInline(truncatePreview(description))}
                <button
                  onClick={onToggleExpand}
                  className="text-[#2E86C1] font-semibold ml-1 px-1 py-1 hover:underline"
                >
                  {t.readMore}
                </button>
              </>
            ) : (
              <>
                {renderBoldInline(description)}
                {isLongDesc && (
                  <div className="mt-2">
                    <button
                      onClick={onToggleExpand}
                      className="text-[#2E86C1] text-[11px] font-semibold px-1 py-1 hover:underline"
                    >
                      {t.showLess}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Action links — always visible, these are the work surface */}
        {item.links.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {item.links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-semibold transition-colors ${LINK_TYPE_BG[link.link_type]}`}
              >
                <span aria-hidden>{LINK_ICON[link.link_type]}</span>
                <span>{link.label}</span>
              </a>
            ))}
          </div>
        )}

        {/* Manager instructions (collapsible amber box, manager view only) */}
        {managerMode && item.manager_instructions && (
          <ManagerInstructions text={item.manager_instructions} />
        )}

        {/* Footer — separated by a thin divider */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          {item.requires_employee_check && (
            action ? (
              <button
                onClick={() => onAction?.(action.key)}
                className="flex-1 px-3 py-2.5 rounded-lg text-[12px] font-bold transition-colors bg-[#1B3A6B] text-white hover:bg-[#2C4F8A] shadow-sm flex items-center justify-center gap-1.5"
              >
                <span>{action.label}</span>
                <span>→</span>
              </button>
            ) : (
              <CheckPill
                label={managerMode ? t.employee : t.you}
                checked={employeeChecked}
                disabled={false}
                timestamp={item.employee_checked_at}
                autoChecked={item.auto_checked}
                onClick={() => onToggle(item.id, 'employee', employeeChecked)}
              />
            )
          )}
          {item.requires_manager_check && (
            <CheckPill
              label={t.manager}
              checked={managerChecked}
              disabled={!canToggleManager}
              timestamp={item.manager_checked_at}
              onClick={() => canToggleManager && onToggle(item.id, 'manager', managerChecked)}
            />
          )}
          {isComplete && (
            <button
              onClick={onToggleExpand}
              className="text-[10px] text-gray-400 hover:text-gray-600 px-2 py-2 font-semibold"
            >
              {t.collapse}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────── Manager-only instructions block ─────────
 * Collapsible amber-tinted callout that renders the item's
 * manager_instructions text. Only used in manager view.
 * Lightweight markdown: blank lines split paragraphs, lines
 * starting with **bold** are rendered bold inline. */
function ManagerInstructions({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-amber-100 transition-colors"
      >
        <span className="text-[11px] font-bold uppercase tracking-widest text-amber-800">
          📘 Manager instructions
        </span>
        <span className={`text-amber-700 text-xs transition-transform ${open ? 'rotate-90' : ''}`}>›</span>
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1 border-t border-amber-200">
          <div className="text-[12px] text-amber-900 leading-relaxed whitespace-pre-wrap">
            {renderBoldInline(text)}
          </div>
        </div>
      )}
    </div>
  );
}

/** Renders **bold** segments inline. Splits on the bold delimiters and
 *  alternates plain/bold spans. URLs auto-link. */
function renderBoldInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const lines = text.split('\n');
  lines.forEach((line, lineIdx) => {
    let lastIndex = 0;
    let keyCounter = 0;
    const lineNodes: React.ReactNode[] = [];
    const boldRegex = /\*\*([^*]+)\*\*/g;
    let m: RegExpExecArray | null;
    while ((m = boldRegex.exec(line)) !== null) {
      if (m.index > lastIndex) lineNodes.push(linkify(line.slice(lastIndex, m.index), `${lineIdx}-${keyCounter++}`));
      lineNodes.push(<strong key={`b-${lineIdx}-${keyCounter++}`}>{m[1]}</strong>);
      lastIndex = m.index + m[0].length;
    }
    if (lastIndex < line.length) lineNodes.push(linkify(line.slice(lastIndex), `${lineIdx}-${keyCounter++}`));
    parts.push(<span key={`l-${lineIdx}`}>{lineNodes}</span>);
    if (lineIdx < lines.length - 1) parts.push(<br key={`br-${lineIdx}`} />);
  });
  return parts;
}

function linkify(s: string, baseKey: string): React.ReactNode {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let k = 0;
  let m: RegExpExecArray | null;
  while ((m = urlRegex.exec(s)) !== null) {
    if (m.index > lastIndex) parts.push(s.slice(lastIndex, m.index));
    parts.push(
      <a key={`u-${baseKey}-${k++}`} href={m[1]} target="_blank" rel="noopener noreferrer" className="underline text-amber-700 hover:text-amber-900">
        {m[1]}
      </a>
    );
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < s.length) parts.push(s.slice(lastIndex));
  return <>{parts}</>;
}

/* ───────── Dual-check pill ───────── */
function CheckPill({
  label,
  checked,
  disabled,
  timestamp,
  autoChecked,
  onClick,
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  timestamp: string | null;
  autoChecked?: boolean;
  onClick: () => void;
}) {
  // min-h keeps the core tap target of the whole feature at the iOS 44px floor.
  const base = 'flex-1 px-3 py-3 min-h-[44px] rounded-lg text-[11px] font-semibold transition-all border';
  if (checked) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${base} bg-green-50 border-green-300 text-green-800 ${disabled ? 'cursor-default' : 'hover:bg-green-100 hover:border-green-400'}`}
        title={timestamp ? new Date(timestamp).toLocaleString() : undefined}
      >
        <div className="flex items-center gap-1.5">
          <span aria-hidden>✓</span>
          <span>{label}</span>
          {autoChecked && <span className="text-[9px] uppercase tracking-wider opacity-70 ml-auto">auto</span>}
        </div>
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${
        disabled
          ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-default'
          : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-[#1B3A6B] hover:text-[#1B3A6B]'
      }`}
    >
      <div className="flex items-center gap-1.5">
        <span aria-hidden className="w-3 h-3 rounded border border-current inline-block" />
        <span>{label}</span>
      </div>
    </button>
  );
}
