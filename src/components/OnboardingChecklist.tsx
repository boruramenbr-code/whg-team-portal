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
}

const SECTION_LABEL: Record<OnboardingSection, { en: string; emoji: string }> = {
  paperwork: { en: 'Paperwork & Setup', emoji: '📋' },
  training: { en: 'Training', emoji: '🎓' },
  first_week: { en: 'First Week', emoji: '🚪' },
  ongoing: { en: 'Ongoing', emoji: '📈' },
};

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
export default function OnboardingChecklist({ endpoint, managerMode = false, targetUserId, compact = false, showHeading = false, onAction }: Props) {
  const [data, setData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Set<OnboardingSection>>(() => new Set<OnboardingSection>(['paperwork']));
  const [savingCategory, setSavingCategory] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(endpoint, { cache: 'no-store' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Failed to load onboarding checklist');
      }
      const j: OnboardingData = await res.json();
      setData(j);
      // Auto-open the first section with an incomplete item
      const firstIncomplete = (['paperwork', 'training', 'first_week', 'ongoing'] as OnboardingSection[])
        .find((sec) => j.items.some((i) => i.section === sec && !i.is_complete));
      if (firstIncomplete) setOpenSections(new Set<OnboardingSection>([firstIncomplete]));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
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
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update');
      load();
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
        <div className="text-gray-400 text-sm animate-pulse">Loading checklist…</div>
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

  return (
    <div className="space-y-3">
      {showHeading && (
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
          <span className="text-base">✅</span>
          Your Onboarding
          <span className="ml-auto text-[11px] font-normal text-gray-500 normal-case tracking-normal">
            {data.progress.fully_complete}/{data.progress.total} done
          </span>
        </h2>
      )}
      {/* Header / progress */}
      <div className={`bg-white rounded-2xl shadow-sm ${compact ? 'p-4' : 'p-5'}`}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Onboarding Checklist</p>
            <h2 className="text-base md:text-lg font-bold text-[#1B3A6B] truncate">
              {managerMode ? data.full_name : 'Your first few weeks'}
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
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">complete</div>
          </div>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all ${data.progress.pct_complete === 100 ? 'bg-green-500' : 'bg-[#1B3A6B]'}`}
            style={{ width: `${data.progress.pct_complete}%` }}
          />
        </div>
        <p className="text-[11px] text-gray-500 mt-2">
          {data.progress.fully_complete} of {data.progress.total} items fully complete · {data.progress.employee_checked} checked by employee · {data.progress.manager_checked} confirmed by manager
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

      {/* Sections */}
      {sections.map((sec) => {
        const sectionItems = data.items.filter((i) => i.section === sec);
        if (sectionItems.length === 0) return null;
        const isOpen = openSections.has(sec);
        const done = sectionItems.filter((i) => i.is_complete).length;
        const total = sectionItems.length;
        return (
          <div key={sec} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button
              onClick={() =>
                setOpenSections((prev) => {
                  const next = new Set(prev);
                  if (next.has(sec)) next.delete(sec);
                  else next.add(sec);
                  return next;
                })
              }
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base">{SECTION_LABEL[sec].emoji}</span>
                <span className="font-bold text-sm text-[#1B3A6B] truncate">{SECTION_LABEL[sec].en}</span>
                <span className="text-[11px] text-gray-500 shrink-0">
                  {done}/{total}
                </span>
              </div>
              <span className={`text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}>›</span>
            </button>
            {isOpen && (
              <div className="border-t border-gray-100 divide-y divide-gray-100">
                {sectionItems.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onToggle={toggleCheck}
                    onAction={onAction}
                    managerMode={managerMode}
                  />
                ))}
              </div>
            )}
          </div>
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
function actionForSource(source: string | null): { key: string; label: string } | null {
  switch (source) {
    case 'handbook_signed': return { key: 'sign_handbook', label: '✍️ Sign Handbook' };
    case 'policy_signatures_all':
    case 'policy_signatures_any': return { key: 'sign_policies', label: '✍️ Sign Policies' };
    case 'our_story_ack': return { key: 'acknowledge_story', label: '📖 Read & Acknowledge' };
    default: return null;
  }
}

/* ───────── Item row ───────── */
function ItemRow({
  item,
  onToggle,
  onAction,
  managerMode,
}: {
  item: OnboardingItem;
  onToggle: (itemId: string, column: 'employee' | 'manager', currentlyChecked: boolean) => void;
  onAction?: (action: string, detail?: string) => void;
  managerMode: boolean;
}) {
  const canToggleManager = managerMode;

  const employeeChecked = !!item.employee_checked_at;
  const managerChecked = !!item.manager_checked_at;

  // For auto-tracked items that aren't yet auto-checked, replace the
  // employee check pill with a primary action button that takes the user
  // to the right surface (signature pad, bar card upload, etc.).
  const action = !employeeChecked && onAction ? actionForSource(item.auto_track_source) : null;

  return (
    <div className={`px-4 py-3 ${item.is_complete ? 'bg-green-50/40' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 whitespace-pre-wrap">{item.title}</p>
          {item.description && (
            <div className="text-xs text-gray-600 mt-0.5 leading-relaxed whitespace-pre-wrap">
              {renderBoldInline(item.description)}
            </div>
          )}
          {item.links.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
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
          {managerMode && item.manager_instructions && (
            <ManagerInstructions text={item.manager_instructions} />
          )}
        </div>
      </div>

      {/* Dual-check row */}
      <div className="flex items-center gap-2 mt-3">
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
              label={managerMode ? 'Employee' : 'You'}
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
            label="Manager"
            checked={managerChecked}
            disabled={!canToggleManager}
            timestamp={item.manager_checked_at}
            onClick={() => canToggleManager && onToggle(item.id, 'manager', managerChecked)}
          />
        )}
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
  const base = 'flex-1 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all border';
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
