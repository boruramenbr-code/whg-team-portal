'use client';

import { useState, useCallback } from 'react';
import { Profile } from '@/lib/types';
import ChatInterface from './ChatInterface';
import Sidebar from './Sidebar';
import WelcomeSplash from './WelcomeSplash';
import PreshiftTab from './PreshiftTab';
import PoliciesTab from './PoliciesTab';

interface Props {
  profile: Profile;
  isManager: boolean;
}

type TabKey = 'handbook' | 'preshift' | 'policies';

export default function DashboardClient({ profile, isManager }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('handbook');
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [handbookSource, setHandbookSource] = useState<'employee' | 'manager'>('employee');
  const [language, setLanguage] = useState<'en' | 'es'>(profile.preferred_language || 'en');
  const [mobileTopicsOpen, setMobileTopicsOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = useCallback(() => setShowSplash(false), []);

  const handleSelect = (q: string) => {
    setPendingQuestion(q);
    setMobileTopicsOpen(false);
    // Selecting a topic should bring the user back to the Handbook tab
    setActiveTab('handbook');
  };

  const firstName = profile.full_name.split(' ')[0];
  const restaurantName = (profile.restaurants as { name?: string } | null)?.name || null;
  const isES = language === 'es';

  const tabs: { key: TabKey; label: string; labelEs: string; emoji: string }[] = [
    { key: 'handbook', label: 'Ask', labelEs: 'Preguntar', emoji: '💬' },
    { key: 'policies', label: 'Policies', labelEs: 'Políticas', emoji: '📘' },
    { key: 'preshift', label: 'Pre-Shift', labelEs: 'Pre-Turno', emoji: '📋' },
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

      {/* Tab bar */}
      <div className="flex items-center border-b border-gray-200 bg-white px-2 md:px-4 flex-shrink-0">
        <div className="flex gap-1">
          {tabs.map((t) => {
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
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

      {/* Tab content */}
      <div className="flex flex-1 overflow-hidden">
        {activeTab === 'handbook' && (
          <>
            <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
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

            {/* Desktop sidebar — only for the Handbook tab */}
            <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 border-l border-gray-100 bg-gray-50/60 overflow-hidden">
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

        {activeTab === 'policies' && (
          <PoliciesTab language={language} />
        )}

        {activeTab === 'preshift' && (
          <PreshiftTab language={language} restaurantName={restaurantName} />
        )}
      </div>
    </div>
  );
}
