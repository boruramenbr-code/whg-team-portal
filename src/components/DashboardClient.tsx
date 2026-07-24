'use client';

import { useState, useCallback, useEffect } from 'react';
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
const MenuTab = dynamic(() => import('./MenuTab'), { loading: TabLoader, ssr: false });
const WelcomeWizard = dynamic(() => import('./WelcomeWizard'), { ssr: false });

interface Props {
  profile: Profile;
  isManager: boolean;
}

// July 2026 restructure (Randy-approved): nav ordered by daily frequency.
//   Home | Training | Menu | Handbook | Team
// "handbook" key kept for stability — now LABELED "Handbook" (was
// "Onboarding"; veterans just want the book). Positions merged into the
// Team tab as a sub-view; Menu promoted to the freed slot.
type TopTabKey = 'home' | 'training' | 'menu' | 'handbook' | 'ourteam';
type HandbookSubTab = 'checklist' | 'read' | 'policies' | 'ask';
type TeamSubTab = 'org' | 'positions';

/* ── SVG icons for bottom nav (inline, no dependency) ── */
const NavIcons: Record<string, (active: boolean) => React.ReactNode> = {
  home: (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={a ? '#1B3A6B' : 'none'} stroke={a ? '#1B3A6B' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  menu: (a) => (
    // Crossed fork & knife — reads as "menu" at small sizes
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? '#1B3A6B' : 'currentColor'} strokeWidth={a ? '2.5' : '2'} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zM21 15v7" />
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
  // Perf: visited tabs stay MOUNTED (hidden, not unmounted) so switching
  // back is instant — no chunk re-parse, no refetch storm, no image reloads.
  // A tab renders when it's active OR already visited.
  const [visitedTops, setVisitedTops] = useState<Set<TopTabKey>>(() => new Set<TopTabKey>(['home']));
  useEffect(() => {
    setVisitedTops((prev) => (prev.has(activeTop) ? prev : new Set(prev).add(activeTop)));
  }, [activeTop]);
  const tabShown = (k: TopTabKey) => activeTop === k;
  const tabMounted = (k: TopTabKey) => activeTop === k || visitedTops.has(k);
  const [activeHandbookSub, setActiveHandbookSub] = useState<HandbookSubTab>(defaultHandbookSub);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [handbookSource, setHandbookSource] = useState<'employee' | 'manager'>('employee');
  const [language, setLanguage] = useState<'en' | 'es'>(profile.preferred_language || 'en');
  const [mobileTopicsOpen, setMobileTopicsOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // ── Owner's master restaurant switcher (admins only) ──
  // Same shared key as the admin side (whg_view_restaurant_id): pick a
  // restaurant once and BOTH sides of the app follow. Home + Positions
  // already read the key; Menu + Team take it as a prop; switching
  // remounts the tab content so everything re-scopes.
  const isAdminUser = profile.role === 'admin';
  const [viewRestaurants, setViewRestaurants] = useState<{ id: string; name: string }[]>([]);
  const [viewRestaurantId, setViewRestaurantId] = useState<string | null>(null);
  useEffect(() => {
    if (!isAdminUser) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('/api/my-locations');
        if (!r.ok || cancelled) return;
        const j = await r.json();
        const locs: { id: string; name: string }[] = j.locations || [];
        if (cancelled) return;
        setViewRestaurants(locs);
        let initial: string | null = null;
        try {
          const saved = localStorage.getItem('whg_view_restaurant_id');
          if (saved && locs.some((l) => l.id === saved)) initial = saved;
        } catch { /* private mode */ }
        setViewRestaurantId(initial || profile.restaurant_id || locs[0]?.id || null);
      } catch { /* bar just doesn't render */ }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdminUser]);
  const switchViewRestaurant = (id: string) => {
    setViewRestaurantId(id);
    try { localStorage.setItem('whg_view_restaurant_id', id); } catch { /* ignore */ }
  };
  const showMasterSwitcher = isAdminUser && viewRestaurants.length > 1;
  const effectiveRestaurantId = (showMasterSwitcher && viewRestaurantId) || profile.restaurant_id;

  // Splash plays once per day, not on every mount — staff who log in every
  // shift shouldn't eat a 3-second ceremony each time. Checked in an effect
  // (not the initializer) to avoid an SSR hydration mismatch; the splash is
  // still opacity-0 in its enter phase, so an immediate dismiss is invisible.
  useEffect(() => {
    try {
      const today = new Date().toDateString();
      if (localStorage.getItem('whg_splash_date') === today) {
        setShowSplash(false);
      } else {
        localStorage.setItem('whg_splash_date', today);
      }
    } catch { /* Safari private mode — keep the splash */ }
  }, []);

  // Welcome Wizard — fires on first login (after migration 052 backfilled
  // existing staff). Closing via "Skip for now" suppresses it for this
  // session only; completing it via the final step calls /api/wizard/complete
  // which stamps wizard_completed_at so it never fires again.
  const [showWizard, setShowWizard] = useState<boolean>(!profile.wizard_completed_at);
  // Team tab sub-view: org chart | position descriptions (merged July 2026).
  const [teamSub, setTeamSub] = useState<TeamSubTab>('org');
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

  // Ordered by daily frequency (July 2026 restructure).
  const topTabs: { key: TopTabKey; label: string; labelEs: string; emoji: string }[] = [
    { key: 'home', label: 'Home', labelEs: 'Inicio', emoji: '🏠' },
    { key: 'training', label: 'Training', labelEs: 'Capacitación', emoji: '🎬' },
    { key: 'menu', label: 'Menu', labelEs: 'Menú', emoji: '🍣' },
    { key: 'handbook', label: 'Handbook', labelEs: 'Manual', emoji: '📘' },
    { key: 'ourteam', label: 'Team', labelEs: 'Equipo', emoji: '👥' },
  ];

  /* Short labels for bottom nav on mobile */
  const mobileLabels: Record<TopTabKey, { en: string; es: string }> = {
    home: { en: 'Home', es: 'Inicio' },
    training: { en: 'Training', es: 'Capacitar' },
    menu: { en: 'Menu', es: 'Menú' },
    handbook: { en: 'Handbook', es: 'Manual' },
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
          language={language}
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

      {/* ── Owner's master restaurant switcher (admins only) ── */}
      {showMasterSwitcher && (
        <div
          className="flex items-center gap-1.5 px-3 md:px-6 py-2 bg-[#0F1E3C] flex-shrink-0 overflow-x-auto [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <span className="text-[9px] font-bold uppercase tracking-widest text-white/50 flex-shrink-0 mr-1">
            {isES ? 'Viendo' : 'Viewing'}
          </span>
          {viewRestaurants.map((r) => {
            const active = viewRestaurantId === r.id;
            return (
              <button
                key={r.id}
                onClick={() => switchViewRestaurant(r.id)}
                className={`tap-highlight flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  active
                    ? 'bg-amber-400 text-[#0F1E3C] shadow-sm'
                    : 'bg-white/10 text-white/75 hover:bg-white/20'
                }`}
              >
                {r.name}
              </button>
            );
          })}
        </div>
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
              className={`tap-highlight px-3 py-2 md:px-2 md:py-0.5 rounded-full text-xs md:text-[10px] font-bold transition-colors ${
                language === 'en'
                  ? 'bg-[#1B3A6B] text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('es')}
              className={`tap-highlight px-3 py-2 md:px-2 md:py-0.5 rounded-full text-xs md:text-[10px] font-bold transition-colors ${
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

      {/* Sub-tab bar — Team (org chart | positions) */}
      {activeTop === 'ourteam' && (
        <div className="flex items-center gap-2 border-b border-[#D6DEE8]/60 bg-[#C8D4E1] pl-1 pr-1.5 md:px-4 flex-shrink-0">
          {([
            { key: 'org' as TeamSubTab, label: isES ? 'Nuestro Equipo' : 'Our Team', emoji: '👥' },
            { key: 'positions' as TeamSubTab, label: isES ? 'Posiciones' : 'Positions', emoji: '🧭' },
          ]).map((t) => {
            const isActive = teamSub === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTeamSub(t.key)}
                className={`tap-highlight relative flex items-center gap-1.5 px-2.5 md:px-4 py-3 md:py-2 text-[13px] md:text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive ? 'text-[#2E86C1]' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <span className="hidden md:inline text-sm">{t.emoji}</span>
                <span>{t.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2E86C1] rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Tab content ──
          Each visited tab stays mounted inside a display-toggled wrapper
          (`contents` when active so layout is unchanged, `hidden` when not).
          First visit lazy-loads the chunk; every revisit is instant. */}
      <div key={viewRestaurantId ?? 'own'} className="flex flex-1 overflow-hidden pb-[72px] md:pb-0">
        {/* HOME */}
        {tabMounted('home') && (
          <div className={tabShown('home') ? 'contents' : 'hidden'}>
          <div className="flex-1 overflow-y-auto tab-content-enter">
            <HomeTab
              firstName={firstName}
              restaurantName={restaurantName}
              language={language}
              onboardingCategory={profile.onboarding_category ?? null}
              isAdmin={isAdminUser}
              onNavigate={(tab) => setActiveTop(tab as TopTabKey)}
            />
          </div>
          </div>
        )}

        {/* MENU — promoted to the bottom nav (staff study it daily).
            Also still reachable inside Training for path deep-links. */}
        {tabMounted('menu') && (
          <div className={tabShown('menu') ? 'contents' : 'hidden'}>
          <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#C5D3E2] via-[#CDDAE7] to-[#D5E0EB] tab-content-enter">
            <div className="max-w-3xl mx-auto px-4 py-6 md:py-8">
              <h1 className="text-2xl md:text-3xl font-bold text-[#1B3A6B]">
                {isES ? 'Menú' : 'Menu'}
              </h1>
              <p className="text-sm text-gray-600 mt-1 mb-4">
                {isES
                  ? 'Conoce cada platillo — foto, ingredientes y alérgenos.'
                  : 'Know every dish — photo, ingredients, and allergens.'}
              </p>
              <MenuTab language={language} viewRestaurantId={showMasterSwitcher ? viewRestaurantId : null} />
            </div>
          </div>
          </div>
        )}

        {/* ONBOARDING — all sub-tabs live inside one keep-mounted wrapper.
            Sub-tabs themselves still mount on first open only. */}
        {tabMounted('handbook') && (
        <div className={tabShown('handbook') ? 'contents' : 'hidden'}>
        {activeHandbookSub === 'checklist' && (
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
              <OnboardingChecklist endpoint="/api/onboarding/me" onAction={handleChecklistAction} language={language} />
            </div>
          </div>
        )}

        {/* ONBOARDING → Handbook */}
        {activeHandbookSub === 'read' && (
          <div className="flex-1 flex flex-col overflow-hidden tab-content-enter">
            <HandbookReaderTab language={language} />
          </div>
        )}

        {/* HANDBOOK & POLICIES → Policies */}
        {activeHandbookSub === 'policies' && (
          <div className="flex-1 flex flex-col overflow-hidden tab-content-enter">
            <PoliciesTab
              language={language}
              initialPolicyId={policiesInitialId}
              onInitialPolicyOpened={() => setPoliciesInitialId(null)}
            />
          </div>
        )}

        {/* HANDBOOK & POLICIES → Ask (chatbot) */}
        {activeHandbookSub === 'ask' && (
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

        </div>
        )}

        {/* TEAM — org chart + position descriptions (merged July 2026) */}
        {tabMounted('ourteam') && (
          <div className={tabShown('ourteam') ? 'contents' : 'hidden'}>
          {teamSub === 'org' ? (
            <div className="flex-1 flex flex-col overflow-hidden tab-content-enter">
              <OurTeamTab
                restaurantId={effectiveRestaurantId}
                restaurantName={restaurantName}
                role={profile.role}
                language={language}
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden tab-content-enter">
              <PositionsSection language={language} />
            </div>
          )}
          </div>
        )}

        {/* TRAINING */}
        {tabMounted('training') && (
          <div className={tabShown('training') ? 'contents' : 'hidden'}>
          <div className="flex-1 flex flex-col overflow-hidden tab-content-enter">
            <TrainingTab language={language} viewRestaurantId={showMasterSwitcher ? viewRestaurantId : null} />
          </div>
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
                  isActive ? 'text-[#1B3A6B]' : 'text-gray-500'
                }`}
              >
                <div className="relative">
                  {NavIcons[t.key](isActive)}
                  {isActive && (
                    <span className="nav-dot-enter absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#1B3A6B]" />
                  )}
                </div>
                <span className={`text-[10px] font-semibold leading-tight ${isActive ? 'text-[#1B3A6B]' : 'text-gray-600'}`}>
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
