'use client';

import { useEffect, useState, useCallback } from 'react';

interface BarCardItem {
  profile_id: string | null;
  full_name: string;
  restaurant_id: string;
  restaurant_name: string;
  expiration_date: string | null;
  days: number | null;
}

interface OwnerMessage {
  id: string;
  message: string;
  start_date: string;
  end_date: string;
}

interface UpcomingHoliday {
  id: string;
  start_date: string;
  end_date: string;
  name: string;
  type: 'closed' | 'slow' | 'normal' | 'busy' | 'all_hands';
}

interface PolicyComplianceItem {
  profile_id: string;
  full_name: string;
  restaurant_name: string;
  unsigned_count: number;
}

interface MissingPreshiftItem {
  restaurant_id: string;
  restaurant_name: string;
}

interface AnniversaryItem {
  profile_id: string;
  full_name: string;
  restaurant_name: string;
  days_until: number;
  years: number;
  hire_date: string;
}

interface RecognitionPerson {
  profile_id: string;
  full_name: string;
  restaurant_name: string;
}

interface RecognitionToday {
  birthdays: RecognitionPerson[];
  anniversaries: AnniversaryItem[];
}

interface WelcomeEndingItem {
  profile_id: string;
  full_name: string;
  restaurant_name: string;
  days_until: number;
}

interface Stale86Item {
  restaurant_id: string;
  restaurant_name: string;
  items: string[];
  count: number;
}

interface ArchivedItem {
  profile_id: string;
  full_name: string;
  restaurant_name: string;
  archived_at: string;
}

interface MissionControlData {
  bar_cards: {
    expired: BarCardItem[];
    critical: BarCardItem[];
    expiring: BarCardItem[];
    upcoming: BarCardItem[];
    missing: BarCardItem[];
  };
  owner_message: OwnerMessage | null;
  stats: {
    active_staff: number;
    new_hires_two_weeks: number;
    holidays_next_7_days: number;
  };
  holidays_upcoming: UpcomingHoliday[];
  policy_compliance: PolicyComplianceItem[];
  missing_preshift: MissingPreshiftItem[];
  anniversaries: AnniversaryItem[];
  recognition_today: RecognitionToday;
  welcome_ending_soon: WelcomeEndingItem[];
  stale_86: Stale86Item[];
  recently_archived: ArchivedItem[];
  is_admin: boolean;
}

interface Props {
  /** Jump to another admin tab when an alert card's CTA is clicked */
  onNavigate: (tab: 'staff' | 'preshift' | 'compliance' | 'barcards') => void;
}

/**
 * Mission Control dashboard — manager landing page.
 *
 * Surfaces the things a manager needs to act on this shift, ranked by urgency.
 * Architecture: composable alert cards. To add a new module's alerts later,
 * extend the API response and add a new <Section>/<AlertCard> render here.
 */
export default function MissionControlDashboard({ onNavigate }: Props) {
  const [data, setData] = useState<MissionControlData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/mission-control', { cache: 'no-store' });
      if (!r.ok) {
        setLoading(false);
        return;
      }
      const d = await r.json();
      setData(d);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center text-gray-400 text-sm">
        Loading Mission Control...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center text-gray-400 text-sm">
        Couldn&apos;t load dashboard. Try refreshing.
      </div>
    );
  }

  const {
    bar_cards,
    owner_message,
    stats,
    holidays_upcoming,
    policy_compliance,
    missing_preshift,
    anniversaries,
    recognition_today,
    welcome_ending_soon,
    stale_86,
    recently_archived,
  } = data;
  const hasRecognitionToday =
    recognition_today.birthdays.length > 0 || recognition_today.anniversaries.length > 0;
  const totalUrgent = bar_cards.expired.length + bar_cards.critical.length + missing_preshift.length;
  const totalWarnings = bar_cards.expiring.length + bar_cards.missing.length + policy_compliance.length;
  const allClear = totalUrgent === 0 && totalWarnings === 0;

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-4 md:py-6 space-y-4 tab-content-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1B3A6B] flex items-center gap-2">
            <span>🎛️</span> Mission Control
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            What needs your attention right now.
          </p>
        </div>
        <button
          onClick={load}
          className="text-xs text-[#2E86C1] hover:underline font-semibold"
          title="Refresh"
        >
          ↻ Refresh
        </button>
      </div>

      {/* All clear state */}
      {allClear && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-6 text-center">
          <div className="text-3xl mb-1">✅</div>
          <p className="text-sm font-bold text-emerald-900">All clear</p>
          <p className="text-[11px] text-emerald-700 mt-1">
            No expired or missing bar cards. Everyone&apos;s in good standing.
          </p>
        </div>
      )}

      {/* ── TODAY'S RECOGNITION ─────────────────────────────────────────── */}
      {hasRecognitionToday ? (
        <section className="bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 border-2 border-amber-300 rounded-2xl p-5 shadow-md">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-2xl" aria-hidden>🎉</span>
            <p className="text-xs font-bold text-amber-900 uppercase tracking-widest">
              Today&apos;s Recognition
            </p>
          </div>

          {recognition_today.birthdays.length > 0 && (
            <div className="mb-3">
              <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wide mb-1.5">
                🎂 Birthday{recognition_today.birthdays.length > 1 ? 's' : ''}
              </p>
              <div className="space-y-1">
                {recognition_today.birthdays.map((b) => (
                  <p key={b.profile_id} className="text-sm">
                    <span className="font-bold text-amber-900">{b.full_name}</span>
                    <span className="text-amber-700"> · {b.restaurant_name}</span>
                  </p>
                ))}
              </div>
            </div>
          )}

          {recognition_today.anniversaries.length > 0 && (
            <div className="mb-3">
              <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wide mb-1.5">
                💎 Work Anniversar{recognition_today.anniversaries.length > 1 ? 'ies' : 'y'}
              </p>
              <div className="space-y-1">
                {recognition_today.anniversaries.map((a) => (
                  <p key={a.profile_id} className="text-sm">
                    <span className="font-bold text-amber-900">{a.full_name}</span>
                    <span className="text-amber-700">
                      {' '}· {a.restaurant_name} · <strong>{a.years}-year{a.years > 1 ? 's' : ''}</strong>
                    </span>
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-amber-300/60">
            <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wide mb-1">
              Make their day — pick one (or all):
            </p>
            <ul className="text-xs text-amber-900 space-y-0.5">
              <li>• Public shoutout at pre-shift line-up</li>
              <li>• Free meal, dessert, or drink on the house</li>
              <li>• Have the team sign a card</li>
              <li>• Personal note or text from you</li>
            </ul>
          </div>
        </section>
      ) : (
        <section className="bg-gray-50/70 border border-gray-200 rounded-2xl px-4 py-3 text-center">
          <p className="text-xs text-gray-500">
            🎂 No birthdays or anniversaries today. Easy day for recognition — but check upcoming below.
          </p>
        </section>
      )}

      {/* ── URGENT (red) ────────────────────────────────────────────────── */}
      {missing_preshift.length > 0 && (
        <AlertCard
          variant="urgent"
          emoji="📋"
          title={`Today's pre-shift not posted at ${missing_preshift.length} ${missing_preshift.length === 1 ? 'restaurant' : 'restaurants'}`}
          description="Make sure today's specials, 86'd items, and focus go up before service starts."
          items={missing_preshift.map((r) => ({
            primary: r.restaurant_name,
            secondary: 'No note for today yet',
          }))}
          ctaLabel="Open Pre-Shift →"
          onCta={() => onNavigate('preshift')}
        />
      )}

      {stale_86.length > 0 && (
        <AlertCard
          variant="warning"
          emoji="🚫"
          title={`${stale_86.reduce((sum, s) => sum + s.count, 0)} stale 86'd ${stale_86.reduce((sum, s) => sum + s.count, 0) === 1 ? 'item' : 'items'} carrying over`}
          description="Items added on a previous day still on today's 86 list. Either back in stock and forgotten, or worth confirming with the kitchen."
          items={stale_86.flatMap((s) =>
            s.items.map((item) => ({
              primary: item,
              secondary: s.restaurant_name,
            }))
          )}
          ctaLabel="Open Pre-Shift →"
          onCta={() => onNavigate('preshift')}
        />
      )}

      {bar_cards.expired.length > 0 && (
        <AlertCard
          variant="urgent"
          emoji="❌"
          title={`${bar_cards.expired.length} bar card${bar_cards.expired.length === 1 ? '' : 's'} EXPIRED`}
          description="These staff cannot legally serve alcohol until renewed."
          items={bar_cards.expired.map((c) => ({
            primary: c.full_name,
            secondary: `${c.restaurant_name} · expired ${Math.abs(c.days ?? 0)} day${Math.abs(c.days ?? 0) === 1 ? '' : 's'} ago`,
          }))}
          ctaLabel="Open Bar Cards →"
          onCta={() => onNavigate('barcards')}
        />
      )}

      {bar_cards.critical.length > 0 && (
        <AlertCard
          variant="urgent"
          emoji="🚨"
          title={`${bar_cards.critical.length} bar card${bar_cards.critical.length === 1 ? '' : 's'} expiring this week`}
          description="≤7 days until expiration. Renew now."
          items={bar_cards.critical.map((c) => ({
            primary: c.full_name,
            secondary: `${c.restaurant_name} · ${c.days} day${c.days === 1 ? '' : 's'} left`,
          }))}
          ctaLabel="Open Bar Cards →"
          onCta={() => onNavigate('barcards')}
        />
      )}

      {/* ── WARNINGS (amber) ────────────────────────────────────────────── */}
      {bar_cards.missing.length > 0 && (
        <AlertCard
          variant="warning"
          emoji="🆕"
          title={`${bar_cards.missing.length} staff missing a bar card`}
          description="Flagged as handling alcohol, but no card on file. Tap the names to expand the full list. Upload each person's card via Bar Cards once you have it."
          items={bar_cards.missing.map((c) => ({
            primary: c.full_name,
            secondary: c.restaurant_name,
          }))}
          ctaLabel="Upload a Bar Card →"
          onCta={() => onNavigate('barcards')}
        />
      )}

      {bar_cards.expiring.length > 0 && (
        <AlertCard
          variant="warning"
          emoji="⚠️"
          title={`${bar_cards.expiring.length} bar card${bar_cards.expiring.length === 1 ? '' : 's'} expiring soon`}
          description="8–30 days from expiration. Time to start their renewal."
          items={bar_cards.expiring.map((c) => ({
            primary: c.full_name,
            secondary: `${c.restaurant_name} · ${c.days} days left`,
          }))}
          ctaLabel="Open Bar Cards →"
          onCta={() => onNavigate('barcards')}
        />
      )}

      {bar_cards.upcoming.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
            🔮 Bar Cards Renewing in Next 31–90 Days ({bar_cards.upcoming.length})
          </p>
          <p className="text-[11px] text-gray-500 mb-2">
            Look-ahead — start the renewal conversation early so it&apos;s never a panic.
          </p>
          <div className="space-y-0.5 text-xs text-gray-700">
            {bar_cards.upcoming.slice(0, 5).map((c) => (
              <div key={c.profile_id || c.full_name}>
                <span className="font-semibold">{c.full_name}</span>
                <span className="text-gray-500"> · {c.restaurant_name} · {c.days} days</span>
              </div>
            ))}
            {bar_cards.upcoming.length > 5 && (
              <p className="text-[11px] italic text-gray-400">
                + {bar_cards.upcoming.length - 5} more
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── LEADERSHIP MEMO (serious — slate) ───────────────────────────── */}
      {owner_message && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 shadow-md">
          <div className="flex items-start gap-3">
            <span className="text-xl mt-0.5" aria-hidden>📋</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-1.5">
                <p className="text-[10px] font-bold text-amber-300 uppercase tracking-widest">
                  Leadership Memo
                </p>
                <span className="text-[10px] text-slate-400">— from ownership</span>
              </div>
              <p className="text-sm text-slate-100 leading-relaxed whitespace-pre-wrap">
                {owner_message.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── POLICY COMPLIANCE (orange warning) ──────────────────────────── */}
      {policy_compliance.length > 0 && (
        <AlertCard
          variant="warning"
          emoji="📝"
          title={`${policy_compliance.length} staff with unsigned policies`}
          description="They've got handbook policies they haven't acknowledged yet. Total signatures pending across all of them, ranked by who's furthest behind."
          items={policy_compliance.map((p) => ({
            primary: p.full_name,
            secondary: `${p.restaurant_name} · ${p.unsigned_count} unsigned`,
          }))}
          ctaLabel="Open Compliance →"
          onCta={() => onNavigate('compliance')}
        />
      )}

      {/* ── WELCOME SPOTLIGHT ENDING SOON (info — recognition reminder) ─── */}
      {welcome_ending_soon.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 shadow-sm">
          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1">
            🎉 New-Hire Spotlight Ending This Week
          </p>
          <p className="text-[11px] text-amber-700/80 mb-2">
            One last proper hello before they roll off the home tab.
          </p>
          <div className="space-y-0.5 text-xs text-amber-900">
            {welcome_ending_soon.map((w) => {
              const dayLabel = w.days_until === 0 ? 'today' :
                w.days_until === 1 ? 'tomorrow' :
                `in ${w.days_until} days`;
              return (
                <div key={w.profile_id}>
                  <span className="font-semibold">{w.full_name}</span>
                  <span className="text-amber-700/80"> · {w.restaurant_name} · ends {dayLabel}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── RECENTLY ARCHIVED STAFF (info — turnover visibility) ─────────── */}
      {recently_archived.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
            📤 Recently Archived ({recently_archived.length} in last 30 days)
          </p>
          <p className="text-[11px] text-gray-500 mb-2">
            Staff archived recently. Useful turnover signal.
          </p>
          <div className="space-y-0.5 text-xs text-gray-700">
            {recently_archived.slice(0, 5).map((a) => {
              const archDate = new Date(a.archived_at);
              const days = Math.round((Date.now() - archDate.getTime()) / (1000 * 60 * 60 * 24));
              return (
                <div key={a.profile_id}>
                  <span className="font-semibold">{a.full_name}</span>
                  <span className="text-gray-500"> · {a.restaurant_name} · {days === 0 ? 'today' : `${days} day${days === 1 ? '' : 's'} ago`}</span>
                </div>
              );
            })}
            {recently_archived.length > 5 && (
              <p className="text-[11px] italic text-gray-400">
                + {recently_archived.length - 5} more
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── UPCOMING ANNIVERSARIES (info — heads-up for the week) ────────── */}
      {anniversaries.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/60 rounded-2xl px-5 py-4 shadow-sm">
          <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-2">
            💎 Anniversaries Coming Up (next 6 days)
          </p>
          <div className="space-y-1.5">
            {anniversaries.map((a) => {
              const dayLabel =
                a.days_until === 0 ? 'today' :
                a.days_until === 1 ? 'tomorrow' :
                `in ${a.days_until} days`;
              const yearLabel = a.years === 1 ? '1-year' : `${a.years}-year`;
              return (
                <div key={a.profile_id} className="flex items-baseline gap-2 text-sm flex-wrap">
                  <span className="font-bold text-emerald-900">{a.full_name}</span>
                  <span className="text-xs text-emerald-700">
                    · {a.restaurant_name} · {yearLabel} anniversary {dayLabel} 🎉
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-emerald-700/70 mt-2 italic">
            Plan a card, a free meal, a public shoutout — small things, big retention impact.
          </p>
        </div>
      )}

      {/* ── HOLIDAYS (next 7 days) ──────────────────────────────────────── */}
      {holidays_upcoming && holidays_upcoming.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
            📅 Coming Up This Week
          </p>
          <div className="space-y-1.5">
            {holidays_upcoming.map((h) => {
              const isMultiDay = h.start_date !== h.end_date;
              const fmt = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
              const dateLabel = isMultiDay
                ? `${fmt(h.start_date)} – ${fmt(h.end_date)}`
                : new Date(h.start_date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
              const colors: Record<string, string> = {
                closed: 'text-emerald-700 bg-emerald-50',
                slow: 'text-sky-700 bg-sky-50',
                normal: 'text-gray-700 bg-gray-100',
                busy: 'text-amber-700 bg-amber-50',
                all_hands: 'text-rose-700 bg-rose-50',
              };
              const emojis: Record<string, string> = {
                closed: '🌿', slow: '🌤️', normal: '📅', busy: '⚡', all_hands: '🔥',
              };
              return (
                <div key={h.id} className="flex items-center gap-2 text-sm">
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${colors[h.type] || colors.normal}`}>
                    {emojis[h.type] || '📅'} {dateLabel}
                  </span>
                  <span className="text-gray-700 font-medium">{h.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── QUICK STATS ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2">
        <StatTile emoji="👥" label="Active staff" value={stats.active_staff} />
        <StatTile emoji="🎉" label="New (14d)" value={stats.new_hires_two_weeks} />
        <StatTile emoji="📅" label="Events / 7d" value={stats.holidays_next_7_days} />
      </div>

      {/* Footer hint for future expansion */}
      <p className="text-[11px] text-gray-400 text-center pt-2">
        Mission Control will grow over time as more modules surface alerts here.
      </p>
    </div>
  );
}

/* ───────── Alert Card ───────── */
type AlertVariant = 'urgent' | 'warning' | 'info';

interface AlertItem {
  primary: string;
  secondary: string;
}

function AlertCard({
  variant,
  emoji,
  title,
  description,
  items,
  ctaLabel,
  onCta,
}: {
  variant: AlertVariant;
  emoji: string;
  title: string;
  description: string;
  items: AlertItem[];
  ctaLabel: string;
  onCta: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const styles: Record<AlertVariant, { bg: string; border: string; titleText: string; descText: string; cta: string }> = {
    urgent: {
      bg: 'bg-gradient-to-r from-red-50 to-rose-50',
      border: 'border-red-300',
      titleText: 'text-red-900',
      descText: 'text-red-800',
      cta: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      bg: 'bg-gradient-to-r from-amber-50 to-orange-50',
      border: 'border-amber-300',
      titleText: 'text-amber-900',
      descText: 'text-amber-800',
      cta: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
    info: {
      bg: 'bg-gradient-to-r from-blue-50 to-indigo-50',
      border: 'border-blue-300',
      titleText: 'text-blue-900',
      descText: 'text-blue-800',
      cta: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
  };
  const s = styles[variant];

  // Collapse long lists; user can expand to see all
  const COLLAPSED_LIMIT = 5;
  const visibleItems = expanded ? items : items.slice(0, COLLAPSED_LIMIT);
  const overflow = items.length - COLLAPSED_LIMIT;

  return (
    <div className={`rounded-2xl border-2 shadow-sm overflow-hidden ${s.bg} ${s.border}`}>
      <div className="px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl mt-0.5" aria-hidden>{emoji}</span>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold leading-tight ${s.titleText}`}>{title}</p>
            <p className={`text-[11px] leading-relaxed mt-1 ${s.descText}`}>{description}</p>
          </div>
        </div>

        {visibleItems.length > 0 && (
          <div className="mt-3 space-y-1 pl-9">
            {visibleItems.map((item, i) => (
              <div key={i} className="flex items-baseline gap-2 text-xs">
                <span className={`font-semibold ${s.titleText}`}>{item.primary}</span>
                <span className={`${s.descText} opacity-80`}>· {item.secondary}</span>
              </div>
            ))}
            {overflow > 0 && !expanded && (
              <button
                onClick={() => setExpanded(true)}
                className={`text-[11px] font-bold underline ${s.titleText} hover:opacity-75 transition-opacity`}
              >
                Show all {items.length} ↓
              </button>
            )}
            {expanded && overflow > 0 && (
              <button
                onClick={() => setExpanded(false)}
                className={`text-[11px] font-bold underline ${s.titleText} hover:opacity-75 transition-opacity`}
              >
                Show less ↑
              </button>
            )}
          </div>
        )}
      </div>
      <div className="px-5 py-2 bg-white/40 border-t border-white/40">
        <button
          onClick={onCta}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${s.cta}`}
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}

function StatTile({ emoji, label, value }: { emoji: string; label: string; value: number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-3 py-3 text-center shadow-sm">
      <div className="text-lg" aria-hidden>{emoji}</div>
      <div className="text-xl font-bold text-[#1B3A6B] mt-0.5">{value}</div>
      <div className="text-[10px] text-gray-500 uppercase tracking-wide mt-0.5">{label}</div>
    </div>
  );
}
