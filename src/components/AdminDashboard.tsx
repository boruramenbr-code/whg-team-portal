'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Profile, Restaurant } from '@/lib/types';
import MissionControlDashboard from './MissionControlDashboard';

// ── Lazy-loaded admin tabs ────────────────────────────────────
// Phase 1 perf fix (May 2026): Mission Control is the admin landing tab
// so it stays eager. Every other admin tab is its own chunk and only
// downloads when the manager clicks into it.
const TabLoader = () => (
  <div className="flex-1 flex items-center justify-center text-gray-400 text-sm py-12">
    Loading…
  </div>
);

const AdminPanel = dynamic(() => import('./AdminPanel'), { loading: TabLoader, ssr: false });
const PreshiftAdminContent = dynamic(() => import('./PreshiftAdminContent'), { loading: TabLoader, ssr: false });
const ManagerStandardsTab = dynamic(() => import('./ManagerStandardsTab'), { loading: TabLoader, ssr: false });
const BarCardsTab = dynamic(() => import('./BarCardsTab'), { loading: TabLoader, ssr: false });
const ComplianceTab = dynamic(() => import('./ComplianceTab'), { loading: TabLoader, ssr: false });
const PayRatesTab = dynamic(() => import('./PayRatesTab'), { loading: TabLoader, ssr: false });
const OnboardingAdminTab = dynamic(() => import('./OnboardingAdminTab'), { loading: TabLoader, ssr: false });

interface Props {
  profile: Profile;
  restaurants: Restaurant[];
}

/**
 * Admin navigation:
 *   • 5 top tabs (4 for non-admins — no Settings)
 *   • Two grouped tabs use a horizontally scrollable pill sub-bar:
 *       — People     → Staff | Onboarding | Bar Cards | Pay Rates
 *       — Standards  → Manager Bible | Compliance
 *   • Mission Control's onNavigate accepts legacy keys (staff, barcards,
 *     compliance, etc.) and the navigate() helper below maps them to the
 *     new top+sub combination so deep-links still work without refactoring
 *     every alert card.
 */
type TopTab = 'dashboard' | 'people' | 'preshift' | 'standards' | 'settings';
type PeopleSubTab = 'staff' | 'onboarding' | 'barcards' | 'payrates';
type StandardsSubTab = 'bible' | 'compliance';

/* ── SVG icons for top-level nav ── */
const AdminNavIcons: Record<string, (active: boolean) => React.ReactNode> = {
  dashboard: (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? '#1B3A6B' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" fill={a ? '#1B3A6B' : 'none'} />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" fill={a ? '#1B3A6B' : 'none'} />
    </svg>
  ),
  people: (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? '#1B3A6B' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" fill={a ? '#1B3A6B' : 'none'} />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  preshift: (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? '#1B3A6B' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill={a ? '#1B3A6B' : 'none'} />
      <polyline points="14 2 14 8 20 8" stroke={a ? 'white' : 'currentColor'} />
      <line x1="16" y1="13" x2="8" y2="13" stroke={a ? 'white' : 'currentColor'} />
      <line x1="16" y1="17" x2="8" y2="17" stroke={a ? 'white' : 'currentColor'} />
    </svg>
  ),
  standards: (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? '#1B3A6B' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" fill={a ? '#1B3A6B' : 'none'} />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  settings: (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? '#1B3A6B' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" fill={a ? '#1B3A6B' : 'none'} />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
};

export default function AdminDashboard({ profile, restaurants }: Props) {
  const [activeTop, setActiveTop] = useState<TopTab>('dashboard');
  const [peopleSub, setPeopleSub] = useState<PeopleSubTab>('staff');
  const [standardsSub, setStandardsSub] = useState<StandardsSubTab>('bible');
  const isAdmin = profile.role === 'admin';

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
        setActiveTop('people');
        setPeopleSub(target);
        break;
      case 'bible':
      case 'standards':
        setActiveTop('standards');
        setStandardsSub('bible');
        break;
      case 'compliance':
        setActiveTop('standards');
        setStandardsSub('compliance');
        break;
      case 'dashboard':
      case 'preshift':
      case 'settings':
        setActiveTop(target as TopTab);
        break;
    }
  }

  const topTabs: { key: TopTab; label: string; emoji: string; adminOnly?: boolean; comingSoon?: boolean }[] = [
    { key: 'dashboard', label: 'Dashboard', emoji: '🎛️' },
    { key: 'people', label: 'People', emoji: '👥' },
    { key: 'preshift', label: 'Pre-Shift', emoji: '📋' },
    { key: 'standards', label: 'Standards', emoji: '📖' },
    ...(isAdmin
      ? [{ key: 'settings' as TopTab, label: 'Settings', emoji: '⚙️', adminOnly: true, comingSoon: true }]
      : []),
  ];

  const peopleSubTabs: { key: PeopleSubTab; label: string; emoji: string }[] = [
    { key: 'staff', label: 'Staff', emoji: '👥' },
    { key: 'onboarding', label: 'Onboarding', emoji: '🚀' },
    { key: 'barcards', label: 'Bar Cards', emoji: '🪪' },
    { key: 'payrates', label: 'Pay Rates', emoji: '💰' },
  ];

  const standardsSubTabs: { key: StandardsSubTab; label: string; emoji: string }[] = [
    { key: 'bible', label: 'Manager Bible', emoji: '📖' },
    { key: 'compliance', label: 'Compliance', emoji: '✅' },
  ];

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* ── DESKTOP top tab bar (hidden on mobile) ── */}
      <div className="hidden md:block border-b border-[#B8C5D4] bg-[#D0DAE5] px-6 flex-shrink-0">
        <div className="max-w-4xl mx-auto flex gap-1">
          {topTabs.map((t) => {
            const isActive = activeTop === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTop(t.key)}
                className={`relative flex items-center gap-1.5 px-5 py-3 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'text-[#1B3A6B]'
                    : t.comingSoon
                    ? 'text-gray-400 hover:text-gray-500'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <span>{t.emoji}</span>
                <span>{t.label}</span>
                {t.comingSoon && !isActive && (
                  <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium ml-1">
                    Soon
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1B3A6B] rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Sub-tab pill bar (People + Standards only) ── */}
      {(activeTop === 'people' || activeTop === 'standards') && (
        <div className="border-b border-[#D6DEE8]/60 bg-[#C8D4E1] pl-1 pr-1.5 md:px-6 flex-shrink-0">
          <div
            className="max-w-4xl mx-auto flex overflow-x-auto [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {(activeTop === 'people' ? peopleSubTabs : standardsSubTabs).map((s) => {
              const isActive = activeTop === 'people'
                ? peopleSub === (s.key as PeopleSubTab)
                : standardsSub === (s.key as StandardsSubTab);
              return (
                <button
                  key={s.key}
                  onClick={() => {
                    if (activeTop === 'people') setPeopleSub(s.key as PeopleSubTab);
                    else setStandardsSub(s.key as StandardsSubTab);
                  }}
                  className={`tap-highlight relative flex items-center gap-1.5 px-2.5 md:px-4 py-3 md:py-2 text-[13px] md:text-xs font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? 'text-[#2E86C1]'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <span className="hidden md:inline text-sm">{s.emoji}</span>
                  <span>{s.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2E86C1] rounded-t-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#C5D3E2] to-[#D5E0EB] pb-[72px] md:pb-0">
        {activeTop === 'dashboard' && (
          <div className="tab-content-enter">
            <MissionControlDashboard onNavigate={navigate} />
          </div>
        )}

        {/* ── PEOPLE ── */}
        {activeTop === 'people' && peopleSub === 'staff' && (
          <div className="tab-content-enter">
            <AdminPanel currentUser={profile} restaurants={restaurants} />
          </div>
        )}
        {activeTop === 'people' && peopleSub === 'onboarding' && (
          <div className="tab-content-enter">
            <OnboardingAdminTab />
          </div>
        )}
        {activeTop === 'people' && peopleSub === 'barcards' && (
          <div className="flex-1 flex flex-col overflow-hidden tab-content-enter" style={{ height: 'calc(100vh - 240px)' }}>
            <BarCardsTab restaurantId={profile.restaurant_id} role={profile.role} />
          </div>
        )}
        {activeTop === 'people' && peopleSub === 'payrates' && (
          <div className="tab-content-enter">
            <PayRatesTab profile={profile} />
          </div>
        )}

        {/* ── PRE-SHIFT ── */}
        {activeTop === 'preshift' && (
          <PreshiftAdminContent isAdmin={isAdmin} restaurants={restaurants} />
        )}

        {/* ── STANDARDS ── */}
        {activeTop === 'standards' && standardsSub === 'bible' && (
          <div className="flex-1 flex flex-col overflow-hidden tab-content-enter" style={{ height: 'calc(100vh - 240px)' }}>
            <ManagerStandardsTab profile={profile} />
          </div>
        )}
        {activeTop === 'standards' && standardsSub === 'compliance' && (
          <div className="tab-content-enter">
            <ComplianceTab />
          </div>
        )}

        {/* ── SETTINGS ── */}
        {activeTop === 'settings' && isAdmin && (
          <div className="max-w-3xl mx-auto px-4 md:px-6 py-12 text-center tab-content-enter">
            <div className="text-4xl mb-3">⚙️</div>
            <h3 className="text-lg font-bold text-gray-400">Settings</h3>
            <p className="text-sm text-gray-400 mt-1">Coming soon — restaurant management, notifications, and more.</p>
          </div>
        )}
      </div>

      {/* ── MOBILE bottom navigation bar (hidden on desktop) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-around px-2 pt-1.5 pb-safe">
          {topTabs.map((t) => {
            const isActive = activeTop === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTop(t.key)}
                className={`tap-highlight flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg min-w-[52px] transition-colors ${
                  isActive
                    ? 'text-[#1B3A6B]'
                    : t.comingSoon
                    ? 'text-gray-400'
                    : 'text-gray-400'
                }`}
              >
                <div className="relative">
                  {AdminNavIcons[t.key]?.(isActive) || <span className="text-lg">{t.emoji}</span>}
                  {isActive && (
                    <span className="nav-dot-enter absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#1B3A6B]" />
                  )}
                </div>
                <span className={`text-[10px] font-semibold leading-tight ${isActive ? 'text-[#1B3A6B]' : ''}`}>
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
