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

// Top-level tabs are grouped by subject. The "handbook" top tab contains
// three sub-tabs (Read / Policies / Ask) since they all belong to the same
// subject. Other subjects (Pre-Shift, Compliance, future Feedback/Reviews)
// stay as their own top-level tabs.
type TopTabKey = 'home' | 'handbook' | 'preshift' | 'compliance' | 'ourteam';
type HandbookSubTab = 'read' | 'policies' | 'ask';

export default function DashboardClient({ profile, isManager }: Props) {
  const [activeTop, setActiveTop] = useState<TopTabKey>('home');
  const [activeHandbookSub, setActiveHandbookSub] = useState<HandbookSubTab>('read');
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [handbookSource, setHandbookSource] = useState<'employee' | 'manager'>('employee');
  const [language, setLanguage] = useState<'en' | 'es'>(profile.preferred_language || 'en');
  const [mobileTopicsOpen, setMobileTopicsOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = useCallback(() => setShowSplash(false), []);

  // Selecting a topic from the sidebar jumps into the Ask sub-tab of the
  // Handbook & Policies section so the question lands in the chat.
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

      {/* Top-level tab bar */}
      <div className="flex items-center border-b border-[#D6DEE8] bg-[#F4F7FB] px-2 md:px-4 flex-shrink-0">
        <div className="flex gap-1">
          {topTabs.map((t) => {
            const isActive = activeTop === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTop(t.key)}
                className={`relative flex items-center gap-1.5 px-3 md:px-4 py-2.5 text-xs md:text-sm font-semibold transition-colors ${
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

      {/* Sub-tab bar — only visible inside Handbook & Policies */}
      {activeTop === 'handbook' && (
        <div className="flex items-center justify-between border-b border-[#D6DEE8]/60 bg-[#ECF0F6] px-2 md:px-4 flex-shrink-0">
          <div className="flex gap-1">
            {handbookSubTabs.map((t) => {
              const isActive = activeHandbookSub === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveHandbookSub(t.key)}
                  className={`relative flex items-center gap-1.5 px-3 md:px-4 py-2 text-[11px] md:text-xs font-semibold transition-colors ${
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
          {/* Language toggle — visible on Read & Policies sub-tabs */}
          <div className="flex items-center gap-0.5 bg-white/60 rounded-full p-0.5 border border-gray-200/60">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                language === 'en'
                  ? 'bg-[#1B3A6B] text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('es')}
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
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

      {/* Tab content */}
      <div className="flex flex-1 overflow-hidden">
        {/* HOME */}
        {activeTop === 'home' && (
          <HomeTab
            firstName={firstName}
            restaurantName={restaurantName}
            language={language}
            onNavigate={(tab) => setActiveTop(tab as TopTabKey)}
          />
        )}

        {/* HANDBOOK & POLICIES → Read */}
        {activeTop === 'handbook' && activeHandbookSub === 'read' && (
          <HandbookReaderTab language={language} />
        )}

        {/* HANDBOOK & POLICIES → Policies */}
        {activeTop === 'handbook' && activeHandbookSub === 'policies' && (
          <PoliciesTab language={language} />
        )}

        {/* HANDBOOK & POLICIES → Ask (chatbot) */}
        {activeTop === 'handbook' && activeHandbookSub === 'ask' && (
          <>
            <main className="flex-1 min-w-0 flex flex-col overflow-hidden bg-gradient-to-b from-[#E8EEF4] to-[#F0F4F9]">
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

              {/* Mobile Topics button */}
              <button
                onClick={() => setMobileTopicsOpen(true)}
                className={`lg:hidden fixed bottom-20 right-4 z-20 px-4 py-2.5 rounded-full shadow-lg text-xs font-bold text-white flex items-center gap-1.5 transition-colors ${
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

            {/* Desktop topics sidebar — only on the Ask sub-tab */}
            <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 border-l border-[#D6DEE8]/60 bg-[#F0F4F9] overflow-hidden">
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

        {/* OUR TEAM (location tabs + team members / pre-shift sub-tabs) */}
        {activeTop === 'ourteam' && (
          <OurTeamTab
            restaurantId={profile.restaurant_id}
            restaurantName={restaurantName}
            role={profile.role}
            language={language}
          />
        )}

        {/* PRE-SHIFT */}
        {activeTop === 'preshift' && (
          <PreshiftTab language={language} restaurantName={restaurantName} />
        )}

        {/* COMPLIANCE (manager-only) */}
        {activeTop === 'compliance' && isManager && (
          <ComplianceTab />
        )}
      </div>
    </div>
  );
}
