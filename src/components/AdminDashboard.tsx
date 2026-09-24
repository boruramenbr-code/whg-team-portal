'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Profile, Restaurant } from '@/lib/types';
import { CHANGELOG, APP_VERSION, ChangelogEntry } from '@/lib/changelog';
import MissionControlDashboard from './MissionControlDashboard';
import { parseTrainingLink } from '@/lib/training-links';
import ManagerZoneBar from './ManagerZoneBar';

// ── Lazy-loaded admin tabs ────────────────────────────────────
// Phase 1 perf fix (May 2026): Mission Control is the admin landing tab
// so it stays eager. Every other admin tab is its own chunk and only
// downloads when the manager clicks into it.
const TabLoader = () => (
  <div className="flex-1 flex items-center justify-center text-whg-dim text-sm py-12">
    Loading…
  </div>
);

const AdminPanel = dynamic(() => import('./AdminPanel'), { loading: TabLoader, ssr: false });
const PreshiftAdminContent = dynamic(() => import('./PreshiftAdminContent'), { loading: TabLoader, ssr: false });
const BarCardsTab = dynamic(() => import('./BarCardsTab'), { loading: TabLoader, ssr: false });
const ComplianceTab = dynamic(() => import('./ComplianceTab'), { loading: TabLoader, ssr: false });
const PayRatesTab = dynamic(() => import('./PayRatesTab'), { loading: TabLoader, ssr: false });
const OnboardingAdminTab = dynamic(() => import('./OnboardingAdminTab'), { loading: TabLoader, ssr: false });
const TrainingAdminTab = dynamic(() => import('./TrainingAdminTab'), { loading: TabLoader, ssr: false });

interface Props {
  profile: Profile;
  restaurants: Restaurant[];
}

/**
 * Admin navigation:
 *   • 5 top tabs (4 for non-admins — no Settings)
 *   • People uses a horizontally scrollable pill sub-bar:
 *       — People → Staff | Onboarding | Bar Cards | Pay Rates | Compliance
 *   • The Manager Bible and Academy live in Manager Resources (/resources)
 *     since Sept 2026 — Mission Control keeps the controls.
 *   • Mission Control's onNavigate accepts legacy keys (staff, barcards,
 *     compliance, etc.) and the navigate() helper below maps them to the
 *     new top+sub combination so deep-links still work without refactoring
 *     every alert card.
 */
type TopTab = 'dashboard' | 'people' | 'preshift' | 'training' | 'settings';
type PeopleSubTab = 'staff' | 'onboarding' | 'barcards' | 'payrates' | 'compliance';

/* ── SVG icons for top-level nav ── */
const AdminNavIcons: Record<string, (active: boolean) => React.ReactNode> = {
  dashboard: (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? '#D9A94E' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" fill={a ? '#D9A94E' : 'none'} />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" fill={a ? '#D9A94E' : 'none'} />
    </svg>
  ),
  people: (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? '#D9A94E' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" fill={a ? '#D9A94E' : 'none'} />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  preshift: (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? '#D9A94E' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill={a ? '#D9A94E' : 'none'} />
      <polyline points="14 2 14 8 20 8" stroke={a ? '#1E1608' : 'currentColor'} />
      <line x1="16" y1="13" x2="8" y2="13" stroke={a ? '#1E1608' : 'currentColor'} />
      <line x1="16" y1="17" x2="8" y2="17" stroke={a ? '#1E1608' : 'currentColor'} />
    </svg>
  ),
  training: (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? '#D9A94E' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" fill={a ? '#D9A94E' : 'none'} />
      <polygon points="10 8 16 12 10 16" fill={a ? '#1E1608' : 'none'} stroke={a ? '#1E1608' : 'currentColor'} />
    </svg>
  ),
  settings: (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? '#D9A94E' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" fill={a ? '#D9A94E' : 'none'} />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
};

export default function AdminDashboard({ profile, restaurants }: Props) {
  const [activeTop, setActiveTop] = useState<TopTab>('dashboard');
  const [peopleSub, setPeopleSub] = useState<PeopleSubTab>('staff');
  const isAdmin = profile.role === 'admin';

  // ── Owner's global restaurant switcher ──
  // One "Viewing:" control that scopes EVERY admin surface to a single
  // restaurant. Persists to the shared whg_view_restaurant_id key (which
  // Mission Control and Onboarding already read), and remounts the tab
  // content on switch so each surface re-scopes cleanly.
  const [viewRestaurantId, setViewRestaurantId] = useState<string | null>(null);
  const showRestaurantSwitcher = isAdmin && restaurants.length > 1;
  // Remount key — bumped only when the restaurant actually changes, not on
  // the first settle below. Mission Control already read the saved key when
  // it mounted; remounting it there loaded it twice on every open.
  const [scopeKey, setScopeKey] = useState(0);
  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem('whg_view_restaurant_id'); } catch { /* private mode */ }
    const initial = (saved && restaurants.some((r) => r.id === saved) ? saved : null)
      || profile.restaurant_id || restaurants[0]?.id || null;
    setViewRestaurantId(initial);
    // Owner with no saved pick yet (or it's gone) — save the real one and
    // re-scope once. Next open skips this.
    if (showRestaurantSwitcher && initial && saved !== initial) {
      try { localStorage.setItem('whg_view_restaurant_id', initial); } catch { /* ignore */ }
      setScopeKey((k) => k + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const switchViewRestaurant = (id: string) => {
    if (id === viewRestaurantId) return;
    setViewRestaurantId(id);
    try { localStorage.setItem('whg_view_restaurant_id', id); } catch { /* ignore */ }
    setScopeKey((k) => k + 1);
  };

  // Perf: visited tabs stay MOUNTED (hidden, not unmounted) so switching
  // back is instant — mirrors DashboardClient. A tab renders when it's
  // active OR already visited.
  const [visitedTops, setVisitedTops] = useState<Set<TopTab>>(() => new Set<TopTab>(['dashboard']));
  useEffect(() => {
    setVisitedTops((prev) => (prev.has(activeTop) ? prev : new Set(prev).add(activeTop)));
  }, [activeTop]);
  const tabShown = (k: TopTab) => activeTop === k;
  const tabMounted = (k: TopTab) => activeTop === k || visitedTops.has(k);

  // Academy lessons and manager videos moved to Manager Resources (Sept
  // 2026). Links already out in Asana tasks and texts still point here
  // (/admin?lesson=…&zone=academy, /admin?video=…) — forward them.
  useEffect(() => {
    const link = parseTrainingLink(window.location.search);
    if (!link || link.kind === 'start') return;
    const toResources = link.kind === 'video' || link.zone === 'academy';
    window.location.replace(`${toResources ? '/resources' : '/dashboard'}${window.location.search}`);
  }, []);

  /**
   * Central navigate helper. Accepts legacy destination keys from Mission
   * Control alert cards and routes them to the right top+sub combination.
   */
  function navigate(target: string) {
    switch (target) {
      case 'staff':
      case 'onboarding':
      case 'barcards':
      case 'payrates':
      case 'compliance':
        setActiveTop('people');
        setPeopleSub(target);
        break;
      case 'bible':
      case 'standards':
        window.location.href = '/resources?tab=bible';
        break;
      case 'newhires':
        setActiveTop('training');
        break;
      case 'dashboard':
      case 'preshift':
      case 'training':
      case 'settings':
        setActiveTop(target as TopTab);
        break;
    }
  }

  const topTabs: { key: TopTab; label: string; emoji: string; adminOnly?: boolean; comingSoon?: boolean }[] = [
    { key: 'dashboard', label: 'Dashboard', emoji: '🎛️' },
    { key: 'people', label: 'People', emoji: '👥' },
    { key: 'preshift', label: 'Pre-Shift', emoji: '📋' },
    { key: 'training', label: 'Training', emoji: '🎬' },
    ...(isAdmin
      ? [{ key: 'settings' as TopTab, label: 'Settings', emoji: '⚙️', adminOnly: true }]
      : []),
  ];

  const peopleSubTabs: { key: PeopleSubTab; label: string; emoji: string }[] = [
    { key: 'staff', label: 'Staff', emoji: '👥' },
    { key: 'onboarding', label: 'Onboarding', emoji: '🚀' },
    { key: 'barcards', label: 'Bar Cards', emoji: '🪪' },
    { key: 'payrates', label: 'Pay Rates', emoji: '💰' },
    { key: 'compliance', label: 'Compliance', emoji: '✅' },
  ];


  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* ── DESKTOP top tab bar (hidden on mobile) ── */}
      <ManagerZoneBar zone="mission-control" />
      <div className="hidden md:block border-b border-whg-line bg-whg-night px-6 flex-shrink-0">
        <div className="max-w-4xl mx-auto flex gap-1">
          {topTabs.map((t) => {
            const isActive = activeTop === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTop(t.key)}
                className={`relative flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors ${
                  isActive ? 'text-whg-gold2' : 'text-whg-dim hover:text-whg-snow'
                }`}
              >
                <span className="[&_svg]:w-4 [&_svg]:h-4" aria-hidden>{AdminNavIcons[t.key]?.(isActive) || t.emoji}</span>
                <span>{t.label}</span>
                {t.comingSoon && !isActive && (
                  <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium ml-1">
                    Soon
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-whg-gold rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Owner's restaurant switcher — scopes every admin surface ── */}
      {showRestaurantSwitcher && (
        <div
          className="flex items-center gap-1.5 px-3 md:px-6 py-2 bg-whg-night2 border-b border-whg-line flex-shrink-0 overflow-x-auto [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <span className="text-[9px] font-bold uppercase tracking-widest text-whg-dim flex-shrink-0 mr-1">
            Viewing
          </span>
          {restaurants.map((r) => {
            const active = viewRestaurantId === r.id;
            return (
              <button
                key={r.id}
                onClick={() => switchViewRestaurant(r.id)}
                className={`tap-highlight flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  active
                    ? 'bg-whg-gold text-whg-goldink shadow-sm'
                    : 'bg-whg-card text-whg-dim border border-whg-line hover:text-whg-snow'
                }`}
              >
                {r.name}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Sub-tab pill bar (People) ── */}
      {activeTop === 'people' && (
        <div className="border-b border-whg-line bg-whg-night pl-1 pr-1.5 md:px-6 flex-shrink-0">
          <div
            className="max-w-4xl mx-auto flex overflow-x-auto [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {peopleSubTabs.map((s) => {
              const isActive = peopleSub === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setPeopleSub(s.key)}
                  className={`tap-highlight relative flex items-center gap-1.5 px-2.5 md:px-4 py-3 md:py-2 text-[13px] md:text-xs font-semibold whitespace-nowrap transition-colors ${
                    isActive ? 'text-whg-gold2' : 'text-whg-dim hover:text-whg-snow'
                  }`}
                >
                  <span className="hidden md:inline text-sm">{s.emoji}</span>
                  <span>{s.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-whg-gold rounded-t-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab content
          Pattern: parent is a flex column with overflow-hidden so each tab
          can flex naturally to fill the remaining height. Tabs that need
          their own internal scroll (Bar Cards, Manager Bible — both have a
          sticky header above a scroll list) use `flex-1 flex flex-col
          overflow-hidden`. All other tabs use `flex-1 overflow-y-auto` so
          they scroll as a whole.
          The previous structure relied on `overflow-y-auto` here + an inline
          `height: calc(100vh - 240px)` magic number on the two scroll-list
          tabs, which left a ~1in band of empty gradient at the bottom on
          mobile (the calc didn't account for the fixed bottom nav). */}
      {/* key: switching the viewed restaurant remounts every open tab so
          each surface re-scopes (Onboarding re-reads the shared key,
          Bar Cards re-inits to the new prop, etc.). */}
      <div
        key={scopeKey}
        className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-whg-night to-whg-night2 pb-[72px] md:pb-0"
      >
        {tabMounted('dashboard') && (
          <div className={tabShown('dashboard') ? 'contents' : 'hidden'}>
          <div className="flex-1 overflow-y-auto tab-content-enter">
            <MissionControlDashboard onNavigate={navigate} />
          </div>
          </div>
        )}

        {/* ── PEOPLE — sub-tabs share one keep-mounted wrapper ── */}
        {tabMounted('people') && (
        <div className={tabShown('people') ? 'contents' : 'hidden'}>
        {peopleSub === 'staff' && (
          <div className="flex-1 overflow-y-auto tab-content-enter">
            <AdminPanel currentUser={profile} restaurants={restaurants} viewRestaurantId={showRestaurantSwitcher ? viewRestaurantId : null} />
          </div>
        )}
        {peopleSub === 'onboarding' && (
          <div className="flex-1 overflow-y-auto tab-content-enter">
            <OnboardingAdminTab />
          </div>
        )}
        {peopleSub === 'barcards' && (
          <div className="flex-1 flex flex-col overflow-hidden tab-content-enter">
            <BarCardsTab restaurantId={(showRestaurantSwitcher && viewRestaurantId) || profile.restaurant_id} role={profile.role} />
          </div>
        )}
        {peopleSub === 'payrates' && (
          <div className="flex-1 overflow-y-auto tab-content-enter">
            <PayRatesTab profile={profile} />
          </div>
        )}
        {peopleSub === 'compliance' && (
          <div className="flex-1 overflow-y-auto tab-content-enter">
            <ComplianceTab />
          </div>
        )}
        </div>
        )}

        {/* ── PRE-SHIFT ── */}
        {tabMounted('preshift') && (
          <div className={tabShown('preshift') ? 'contents' : 'hidden'}>
          <div className="flex-1 overflow-y-auto tab-content-enter">
            <PreshiftAdminContent isAdmin={isAdmin} restaurants={restaurants} />
          </div>
          </div>
        )}

        {/* ── TRAINING ── */}
        {tabMounted('training') && (
          <div className={tabShown('training') ? 'contents' : 'hidden'}>
          <div className="flex-1 overflow-y-auto tab-content-enter">
            <TrainingAdminTab
              viewRestaurantId={showRestaurantSwitcher ? viewRestaurantId : null}
              isAdmin={isAdmin}
              onNavigate={navigate}
            />
          </div>
          </div>
        )}

        {/* ── SETTINGS ── */}
        {activeTop === 'settings' && isAdmin && (
          <div className="flex-1 overflow-y-auto tab-content-enter">
            <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-4">
              <h1 className="text-2xl md:text-3xl font-bold text-[#1B3A6B]">Settings</h1>

              {/* About / version history */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <span className="text-base">📦</span> Version History
                  </h2>
                  <span className="text-[11px] font-bold text-[#1B3A6B] bg-[#1B3A6B]/10 px-2.5 py-1 rounded-full">
                    {APP_VERSION}
                  </span>
                </div>
                <div className="divide-y divide-gray-100">
                  {CHANGELOG.map((entry) => (
                    <ChangelogRow key={entry.version} entry={entry} isCurrent={`v${entry.version}` === APP_VERSION} />
                  ))}
                </div>
              </div>

              <p className="text-xs text-gray-400 text-center pt-2">
                More settings coming — restaurant management, notifications, and more.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── MOBILE bottom navigation bar (hidden on desktop) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-whg-night border-t border-whg-line shadow-[0_-2px_10px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-around px-2 pt-1.5 pb-safe">
          {topTabs.map((t) => {
            const isActive = activeTop === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTop(t.key)}
                className={`tap-highlight flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg min-w-[52px] transition-colors ${
                  isActive ? 'text-whg-gold' : 'text-whg-dim'
                }`}
              >
                <div className="relative">
                  {AdminNavIcons[t.key]?.(isActive) || <span className="text-lg">{t.emoji}</span>}
                  {isActive && (
                    <span className="nav-dot-enter absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-whg-gold" />
                  )}
                </div>
                <span className={`text-[10px] font-semibold leading-tight ${isActive ? 'text-whg-gold' : ''}`}>
                  {t.label}
                </span>
                {t.comingSoon && !isActive && (
                  <span className="text-[8px] text-gray-400 -mt-0.5">Soon</span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

/* ───────── Version history row (Settings tab) ─────────
 * Newest release starts expanded; older ones collapse to a single line
 * so the history stays scannable as it grows. */
function ChangelogRow({ entry, isCurrent }: { entry: ChangelogEntry; isCurrent: boolean }) {
  const [open, setOpen] = useState(isCurrent);
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="tap-highlight w-full flex items-center justify-between gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#1B3A6B] truncate">
            v{entry.version}
            {isCurrent && (
              <span className="ml-2 text-[9px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full align-middle">
                Current
              </span>
            )}
          </p>
          <p className="text-xs text-gray-500 truncate">{entry.date} · {entry.title}</p>
        </div>
        <span className={`text-gray-400 text-base transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}>⌄</span>
      </button>
      {open && (
        <ul className="px-5 pb-4 space-y-1.5">
          {entry.notes.map((note, i) => (
            <li key={i} className="text-xs text-gray-600 leading-relaxed flex items-start gap-2">
              <span className="text-gray-300 shrink-0 leading-tight">•</span>
              <span>{note}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
