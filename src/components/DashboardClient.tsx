'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Profile } from '@/lib/types';
import WelcomeSplash from './WelcomeSplash';
import HomeTab from './HomeTab';

// ── Lazy-loaded tabs ──────────────────────────────────────────
// Phase 1 perf fix (May 2026): Each tab is its own chunk so first-paint
// JS only ships HomeTab + WelcomeSplash. Other tabs download on first
// visit. `ssr: false` is safe because DashboardClient is already 'use client'.
const TabLoader = () => (
  <div className="flex-1 flex items-center justify-center text-gray-400 text-sm py-12">
    Loading…
  </div>
);

const ChatInterface = dynamic(() => import('./ChatInterface'), { loading: TabLoader, ssr: false });
const Sidebar = dynamic(() => import('./Sidebar'), { ssr: false });
const TrainingTab = dynamic(() => import('./TrainingTab'), { loading: TabLoader, ssr: false });
const PoliciesTab = dynamic(() => import('./PoliciesTab'), { loading: TabLoader, ssr: false });
const HandbookReaderTab = dynamic(() => import('./HandbookReaderTab'), { loading: TabLoader, ssr: false });
const OurTeamTab = dynamic(() => import('./OurTeamTab'), { loading: TabLoader, ssr: false });
const PositionsSection = dynamic(() => import('./PositionsSection'), { loading: TabLoader, ssr: false });
const OnboardingChecklist = dynamic(() => import('./OnboardingChecklist'), { loading: TabLoader, ssr: false });
const WelcomeWizard = dynamic(() => import('./WelcomeWizard'), { ssr: false });

interface Props {
  profile: Profile;
  isManager: boolean;
}

type TopTabKey = 'home' | 'positions' | 'handbook' | 'training' | 'ourteam';
// "handbook" key kept for stability — labeled "Onboarding" in the UI.
// Pre-Shift was demoted from the bottom nav in June 2026 — today's note is
// still visible on Home, and the dedicated PreshiftTab lives in the admin
// section. Training took its slot.
type HandbookSubTab = 'checklist' | 'read' | 'policies' | 'ask';

/* ── SVG icons for bottom nav (inline, no dependency) ── */
const NavIcons: Record<string, (active: boolean) => React.ReactNode> = {
  home: (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={a ? '#1B3A6B' : 'none'} stroke={a ? '#1B3A6B' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  positions: (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? '#1B3A6B' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" fill={a ? '#1B3A6B' : 'none'} />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" stroke={a ? 'white' : 'currentColor'} fill={a ? 'white' : 'none'} />
    </svg>
  ),
  handbook: (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={a ? '#1B3A6B' : 'none'} stroke={a ? '#1B3A6B' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  ourteam: (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? '#1B3A6B' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" fill={a ? '#1B3A6B' : 'none'} />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  training: (a) => (
    // Play-button-in-rectangle — reads as "video" at small sizes
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? '#1B3A6B' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" fill={a ? '#1B3A6B' : 'none'} />
      <polygon points="10 8 16 12 10 16" fill={a ? 'white' : 'none'} stroke={a ? 'white' : 'currentColor'} />
    </svg>
  ),
};

export default function DashboardClient({ profile, isManager }: Props) {
  // Smart default for the Onboarding sub-tab:
  //   • New hires (welcome_until still in the future, or hired in the last 90 days) → land on Checklist
  //   • Everyone else → land on Handbook (the old default)
  const todayMs = Date.now();
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
  const isWelcomeActive = profile.welcome_until && new Date(profile.welcome_until).getTime() >= todayMs;
  const isRecentHire = profile.hire_date && (todayMs - new Date(profile.hire_date).getTime()) <= ninetyDaysMs;
  const defaultHandbookSub: HandbookSubTab = (isWelcomeActive || isRecentHire) ? 'checklist' : 'read';

  const [activeTop, setActiveTop] = useState<TopTabKey>('home');
  const [activeHandbookSub, setActiveHandbookSub] = useState<HandbookSubTab>(defaultHandbookSub);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [handbookSource, setHandbookSource] = useState<'employee' | 'manager'>('employee');
  const [language, setLanguage] = useState<'en' | 'es'>(profile.preferred_language || 'en');
  const [mobileTopicsOpen, setMobileTopicsOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Welcome Wizard — fires on first login (after migration 052 backfilled
  // existing staff). Closing via "Skip for now" suppresses it for this
  // session only; completing it via the final step calls /api/wizard/complete
  // which stamps wizard_completed_at so it never fires again.
  const [showWizard, setShowWizard] = useState<boolean>(!profile.wizard_completed_at);
  // Replay mode — true when user re-launched the wizard via the "Watch intro
  // again" link. Forces every step to render regardless of acknowledgment
  // status so they get the full refresher.
  const [wizardReplay, setWizardReplay] = useState(false);

  // Deep-link target for the Policies sub-tab. When the user taps "Sign
  // Handbook" on the checklist, we set this to the handbook policy id so
  // PoliciesTab auto-opens its detail view. PoliciesTab clears it after.
  const [policiesInitialId, setPoliciesInitialId] = useState<string | null>(null);

  /** Resolve the active handbook policy id and stash it for PoliciesTab. */
  const goSignHandbook = useCallback(async () => {
    try {
      const res = await fetch('/api/policies', { cache: 'no-store' });
      if (!res.ok) return;
      const j = await res.json();
      const handbook = j?.grouped?.handbook;
      if (handbook?.id) setPoliciesInitialId(handbook.id);
    } catch { /* silent — they can still tap the handbook card manually */ }
    setActiveTop('handbook');
    setActiveHandbookSub('policies');
  }, []);

  /** Maps a checklist action to a navigation. */
  const handleChecklistAction = useCallback((action: string) => {
    switch (action) {
      case 'sign_handbook':
        goSignHandbook();
        break;
      case 'sign_policies':
        setActiveTop('handbook');
        setActiveHandbookSub('policies');
        break;
      case 'acknowledge_story':
        // Replay the wizard — its Step 3 is Our Story.
        setWizardReplay(true);
        setShowWizard(true);
        break;
    }
  }, [goSignHandbook]);

  const handleSplashComplete = useCallback(() => setShowSplash(false), []);

  const handleSelect = (q: string) => {
    setPendingQuestion(q);
    setMobileTopicsOpen(false);
    setActiveTop('handbook');
    setActiveHandbookSub('ask');
  };

  const firstName = profile.full_name.split(' ')[0];
  const restaurantName = (profile.restaurants as { name?: string } | null)?.name || null;
  const isES = language === 'es';

  const topTabs: { key: TopTabKey; label: string; labelEs: string; emoji: string }[] = [
    { key: 'home', label: 'Home', labelEs: 'Inicio', emoji: '🏠' },
    { key: 'positions', label: 'Positions', labelEs: 'Posiciones', emoji: '🧭' },
    { key: 'handbook', label: 'Onboarding', labelEs: 'Onboarding', emoji: '📘' },
    { key: 'training', label: 'Training', labelEs: 'Capacitación', emoji: '🎬' },
    { key: 'ourteam', label: 'Our Team', labelEs: 'Nuestro Equipo', emoji: '👥' },
  ];

  /* Short labels for bottom nav on mobile */
  const mobileLabels: Record<TopTabKey, { en: string; es: string }> = {
    home: { en: 'Home', es: 'Inicio' },
    positions: { en: 'Positions', es: 'Posiciones' },
    handbook: { en: 'Onboarding', es: 'Onboarding' },
    training: { en: 'Training', es: 'Capacitar' },
    ourteam: { en: 'Team', es: 'Equipo' },
  };

  const handbookSubTabs: { key: HandbookSubTab; label: string; labelEs: string; emoji: string }[] = [
    { key: 'checklist', label: 'Checklist', labelEs: 'Lista', emoji: '✅' },
    { key: 'read', label: 'Handbook', labelEs: 'Manual', emoji: '📖' },
    { key: 'policies', label: 'Policies', labelEs: 'Políticas', emoji: '✍️' },
    { key: 'ask', label: 'Ask', labelEs: 'Chat', emoji: '💬' },
  ];

  return (
    <div className="flex flex-col flex-1 overflow-hidden relative">
      {/* Welcome Wizard — first-login onboarding flow (steps: install,
          welcome, our story, checklist intro). Sits above everything else,
          including the splash. Can also be replayed manually from the
          "Watch intro again" link in the Onboarding tab. */}
      {showWizard && !showSplash && (
        <WelcomeWizard
          firstName={firstName}
          restaurantName={restaurantName}
          forceReplay={wizardReplay}
          onComplete={() => { setShowWizard(false); setWizardReplay(false); }}
          onGoToChecklist={() => {
            setActiveTop('handbook');
            setActiveHandbookSub('checklist');
          }}
        />
      )}

      {/* Welcome splash on login */}
      {showSplash && (
        <WelcomeSplash
          firstName={firstName}
          restaurantName={restaurantName}
          onComplete={handleSplashComplete}
        />
      )}

      {/* ── DESKTOP top tab bar (hidden on mobile) ── */}
      <div className="hidden md:flex items-center border-b border-[#D6DEE8] bg-[#D0DAE5] px-4 flex-shrink-0">
        <div className="flex gap-1">
          {topTabs.map((t) => {
            const isActive = activeTop === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTop(t.key)}
                className={`relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'text-[#1B3A6B]'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <span>{t.emoji}</span>
                <span>{isES ? t.labelEs : t.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1B3A6B] rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-tab bar — Onboarding (visible on both mobile + desktop) */}
      {activeTop === 'handbook' && (
        <div className="flex items-center justify-between gap-2 border-b border-[#D6DEE8]/60 bg-[#C8D4E1] pl-1 pr-1.5 md:px-4 flex-shrink-0">
          {/* Scrollable sub-tab row — emoji hidden on mobile, shown on desktop */}
          <div
            className="flex gap-0 min-w-0 flex-1 overflow-x-auto [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {handbookSubTabs.map((t) => {
              const isActive = activeHandbookSub === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveHandbookSub(t.key)}
                  className={`tap-highlight relative flex items-center gap-1.5 px-2.5 md:px-4 py-3 md:py-2 text-[13px] md:text-xs font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? 'text-[#2E86C1]'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <span className="hidden md:inline text-sm">{t.emoji}</span>
                  <span>{isES ? t.labelEs : t.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2E86C1] rounded-t-full" />
                  )}
                </button>
              );
            })}
          </div>
          {/* Language toggle — compact on mobile */}
          <div className="flex-shrink-0 flex items-center gap-0.5 bg-white/60 rounded-full p-0.5 border border-gray-200/60">
            <button
              onClick={() => setLanguage('en')}
              className={`tap-highlight px-2 py-1 md:px-2 md:py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                language === 'en'
                  ? 'bg-[#1B3A6B] text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('es')}
              className={`tap-highlight px-2 py-1 md:px-2 md:py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                language === 'es'
                  ? 'bg-[#1B3A6B] text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              ES
            </button>
          </div>
        </div>
      )}

      {/* ── Tab content ── */}
      <div className="flex flex-1 overflow-hidden pb-[72px] md:pb-0">
        {/* HOME */}
        {activeTop === 'home' && (
          <div className="flex-1 overflow-y-auto tab-content-enter">
            <HomeTab
              firstName={firstName}
              restaurantName={restaurantName}
              language={language}
              onboardingCategory={profile.onboarding_category ?? null}
              onNavigate={(tab) => setActiveTop(tab as TopTabKey)}
            />
          </div>
        )}

        {/* TEAM POSITIONS */}
        {activeTop === 'positions' && (
          <div className="flex-1 flex flex-col overflow-hidden tab-content-enter">
            <PositionsSection language={language} />
          </div>
        )}

        {/* ONBOARDING → Checklist */}
        {activeTop === 'handbook' && activeHandbookSub === 'checklist' && (
          <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#C5D3E2] via-[#CDDAE7] to-[#D5E0EB] tab-content-enter">
            <div className="max-w-3xl mx-auto px-4 py-6 md:py-8">
              <div className="flex items-start justify-between gap-3 mb-1">
                <h1 className="text-2xl md:text-3xl font-bold text-[#1B3A6B]">
                  {isES ? 'Tu Lista de Bienvenida' : 'Your Onboarding'}
                </h1>
                <button
                  onClick={() => { setWizardReplay(true); setShowWizard(true); }}
                  className="flex-shrink-0 text-[11px] text-[#2E86C1] hover:text-[#1B3A6B] underline underline-offset-2 mt-1.5"
                >
                  {isES ? 'Ver intro de nuevo' : 'Watch intro again'}
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-5">
                {isES
                  ? 'Trabaja en cada elemento. Tu manager confirmará los completados.'
                  : 'Work through each item — your manager will confirm completed ones.'}
              </p>
              <OnboardingChecklist endpoint="/api/onboarding/me" onAction={handleChecklistAction} />
            </div>
          </div>
        )}

        {/* ONBOARDING → Handbook */}
        {activeTop === 'handbook' && activeHandbookSub === 'read' && (
          <div className="flex-1 flex flex-col overflow-hidden tab-content-enter">
            <HandbookReaderTab language={language} />
          </div>
        )}

        {/* HANDBOOK & POLICIES → Policies */}
        {activeTop === 'handbook' && activeHandbookSub === 'policies' && (
          <div className="flex-1 flex flex-col overflow-hidden tab-content-enter">
            <PoliciesTab
              language={language}
              initialPolicyId={policiesInitialId}
              onInitialPolicyOpened={() => setPoliciesInitialId(null)}
            />
          </div>
        )}

        {/* HANDBOOK & POLICIES → Ask (chatbot) */}
        {activeTop === 'handbook' && activeHandbookSub === 'ask' && (
          <>
            <main className="flex-1 min-w-0 flex flex-col overflow-hidden bg-gradient-to-b from-[#C5D3E2] to-[#D5E0EB] tab-content-enter">
              <div className="max-w-2xl w-full mx-auto h-full flex flex-col">
                <ChatInterface
                  profile={profile}
                  pendingQuestion={pendingQuestion}
                  onPendingQuestionConsumed={() => setPendingQuestion(null)}
                  onHandbookSourceChange={setHandbookSource}
                  language={language}
                  onLanguageChange={setLanguage}
                  forceSource="employee"
                />
              </div>

              {/* Mobile Topics button — above bottom nav + chat input */}
              <button
                onClick={() => setMobileTopicsOpen(true)}
                className={`lg:hidden fixed bottom-36 md:bottom-20 right-4 z-20 px-4 py-2.5 rounded-full shadow-lg text-xs font-bold text-white flex items-center gap-1.5 transition-colors ${
                  handbookSource === 'manager' ? 'bg-amber-600' : 'bg-[#1B3A6B]'
                }`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
                Topics
              </button>
            </main>

            {/* Desktop topics sidebar */}
            <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 border-l border-[#D6DEE8]/60 bg-[#CDDAE7] overflow-hidden">
              <Sidebar handbookSource={handbookSource} onSelect={handleSelect} language={language} />
            </aside>

            {/* Mobile topics sheet */}
            {mobileTopicsOpen && (
              <>
                <div
                  className="lg:hidden fixed inset-0 bg-black/40 z-30"
                  onClick={() => setMobileTopicsOpen(false)}
                />
                <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white rounded-t-2xl shadow-2xl max-h-[75vh] flex flex-col">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
                    <h3 className="font-semibold text-[#1B3A6B] text-sm">Browse Topics</h3>
                    <button
                      onClick={() => setMobileTopicsOpen(false)}
                      className="text-gray-400 hover:text-gray-600 text-lg font-light leading-none"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="overflow-y-auto flex-1">
                    <Sidebar handbookSource={handbookSource} onSelect={handleSelect} language={language} />
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* OUR TEAM */}
        {activeTop === 'ourteam' && (
          <div className="flex-1 flex flex-col overflow-hidden tab-content-enter">
            <OurTeamTab
              restaurantId={profile.restaurant_id}
              restaurantName={restaurantName}
              role={profile.role}
              language={language}
            />
          </div>
        )}

        {/* TRAINING */}
        {activeTop === 'training' && (
          <div className="flex-1 flex flex-col overflow-hidden tab-content-enter">
            <TrainingTab language={language} />
          </div>
        )}
      </div>

      {/* ── MOBILE bottom navigation bar (hidden on desktop) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-around px-1 pt-1.5 pb-safe">
          {topTabs.map((t) => {
            const isActive = activeTop === t.key;
            const label = isES ? mobileLabels[t.key].es : mobileLabels[t.key].en;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTop(t.key)}
                className={`tap-highlight flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg min-w-[52px] transition-colors ${
                  isActive ? 'text-[#1B3A6B]' : 'text-gray-400'
                }`}
              >
                <div className="relative">
                  {NavIcons[t.key](isActive)}
                  {isActive && (
                    <span className="nav-dot-enter absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#1B3A6B]" />
                  )}
                </div>
                <span className={`text-[10px] font-semibold leading-tight ${isActive ? 'text-[#1B3A6B]' : 'text-gray-400'}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
