'use client';

import { useState, useCallback } from 'react';
import { Profile } from '@/lib/types';
import ChatInterface from './ChatInterface';
import Sidebar from './Sidebar';
import WelcomeSplash from './WelcomeSplash';
import PreshiftTab from './PreshiftTab';
import PoliciesTab from './PoliciesTab';
import ComplianceTab from './ComplianceTab';
import HandbookReaderTab from './HandbookReaderTab';
import OurTeamTab from './OurTeamTab';
import HomeTab from './HomeTab';

interface Props {
  profile: Profile;
  isManager: boolean;
}

type TopTabKey = 'home' | 'handbook' | 'preshift' | 'compliance' | 'ourteam';
type HandbookSubTab = 'read' | 'policies' | 'ask';

/* ── SVG icons for bottom nav (inline, no dependency) ── */
const NavIcons: Record<string, (active: boolean) => React.ReactNode> = {
  home: (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={a ? '#1B3A6B' : 'none'} stroke={a ? '#1B3A6B' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
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
  preshift: (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? '#1B3A6B' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill={a ? '#1B3A6B' : 'none'} />
      <polyline points="14 2 14 8 20 8" stroke={a ? 'white' : 'currentColor'} />
      <line x1="16" y1="13" x2="8" y2="13" stroke={a ? 'white' : 'currentColor'} />
      <line x1="16" y1="17" x2="8" y2="17" stroke={a ? 'white' : 'currentColor'} />
    </svg>
  ),
  compliance: (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? '#1B3A6B' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill={a ? '#1B3A6B' : 'none'} />
      <polyline points="9 12 11 14 15 10" stroke={a ? 'white' : 'currentColor'} />
    </svg>
  ),
};

export default function DashboardClient({ profile, isManager }: Props) {
  const [activeTop, setActiveTop] = useState<TopTabKey>('home');
  const [activeHandbookSub, setActiveHandbookSub] = useState<HandbookSubTab>('read');
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [handbookSource, setHandbookSource] = useState<'employee' | 'manager'>('employee');
  const [language, setLanguage] = useState<'en' | 'es'>(profile.preferred_language || 'en');
  const [mobileTopicsOpen, setMobileTopicsOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

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
    { key: 'handbook', label: 'Handbook & Policies', labelEs: 'Manual y Políticas', emoji: '📘' },
    { key: 'ourteam', label: 'Our Team', labelEs: 'Nuestro Equipo', emoji: '👥' },
    { key: 'preshift', label: 'Pre-Shift', labelEs: 'Pre-Turno', emoji: '📋' },
    ...(isManager
      ? [{ key: 'compliance' as TopTabKey, label: 'Compliance', labelEs: 'Cumplimiento', emoji: '✅' }]
      : []),
  ];

  /* Short labels for bottom nav on mobile */
  const mobileLabels: Record<TopTabKey, { en: string; es: string }> = {
    home: { en: 'Home', es: 'Inicio' },
    handbook: { en: 'Handbook', es: 'Manual' },
    ourteam: { en: 'Team', es: 'Equipo' },
    preshift: { en: 'Pre-Shift', es: 'Pre-Turno' },
    compliance: { en: 'Comply', es: 'Cumplir' },
  };

  const handbookSubTabs: { key: HandbookSubTab; label: string; labelEs: string; emoji: string }[] = [
    { key: 'read', label: 'Read', labelEs: 'Leer', emoji: '📖' },
    { key: 'policies', label: 'Policies', labelEs: 'Políticas', emoji: '✍️' },
    { key: 'ask', label: 'Ask', labelEs: 'Preguntar', emoji: '💬' },
  ];

  return (
    <div className="flex flex-col flex-1 overflow-hidden relative">
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

      {/* Sub-tab bar — Handbook & Policies (visible on both mobile + desktop) */}
      {activeTop === 'handbook' && (
        <div className="flex items-center justify-between border-b border-[#D6DEE8]/60 bg-[#C8D4E1] px-2 md:px-4 flex-shrink-0">
          <div className="flex gap-1">
            {handbookSubTabs.map((t) => {
              const isActive = activeHandbookSub === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveHandbookSub(t.key)}
                  className={`tap-highlight relative flex items-center gap-1.5 px-3 md:px-4 py-2 text-[11px] md:text-xs font-semibold transition-colors ${
                    isActive
                      ? 'text-[#2E86C1]'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <span className="text-sm">{t.emoji}</span>
                  <span>{isES ? t.labelEs : t.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2E86C1] rounded-t-full" />
                  )}
                </button>
              );
            })}
          </div>
          {/* Language toggle */}
          <div className="flex items-center gap-0.5 bg-white/60 rounded-full p-0.5 border border-gray-200/60">
            <button
              onClick={() => setLanguage('en')}
              className={`tap-highlight px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                language === 'en'
                  ? 'bg-[#1B3A6B] text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('es')}
              className={`tap-highlight px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
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
              onNavigate={(tab) => setActiveTop(tab as TopTabKey)}
            />
          </div>
        )}

        {/* HANDBOOK & POLICIES → Read */}
        {activeTop === 'handbook' && activeHandbookSub === 'read' && (
          <div className="flex-1 flex flex-col overflow-hidden tab-content-enter">
            <HandbookReaderTab language={language} />
          </div>
        )}

        {/* HANDBOOK & POLICIES → Policies */}
        {activeTop === 'handbook' && activeHandbookSub === 'policies' && (
          <div className="flex-1 flex flex-col overflow-hidden tab-content-enter">
            <PoliciesTab language={language} />
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
                />
              </div>

              {/* Mobile Topics button — positioned above bottom nav */}
              <button
                onClick={() => setMobileTopicsOpen(true)}
                className={`lg:hidden fixed bottom-24 right-4 z-20 px-4 py-2.5 rounded-full shadow-lg text-xs font-bold text-white flex items-center gap-1.5 transition-colors ${
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

        {/* PRE-SHIFT */}
        {activeTop === 'preshift' && (
          <div className="flex-1 flex flex-col overflow-hidden tab-content-enter">
            <PreshiftTab language={language} restaurantName={restaurantName} />
          </div>
        )}

        {/* COMPLIANCE (manager-only) */}
        {activeTop === 'compliance' && isManager && (
          <div className="flex-1 flex flex-col overflow-hidden tab-content-enter">
            <ComplianceTab />
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
