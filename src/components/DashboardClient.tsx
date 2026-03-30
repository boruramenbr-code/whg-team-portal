'use client';

import { useState } from 'react';
import { Profile } from '@/lib/types';
import ChatInterface from './ChatInterface';
import Sidebar from './Sidebar';

interface Props {
  profile: Profile;
  isManager: boolean;
}

export default function DashboardClient({ profile, isManager }: Props) {
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [handbookSource, setHandbookSource] = useState<'employee' | 'manager'>('employee');
  const [mobileTopicsOpen, setMobileTopicsOpen] = useState(false);

  const handleSelect = (q: string) => {
    setPendingQuestion(q);
    setMobileTopicsOpen(false);
  };

  return (
    <div className="flex flex-1 overflow-hidden relative">
      {/* Chat — main area */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <div className="max-w-2xl w-full mx-auto h-full flex flex-col">
          <ChatInterface
            profile={profile}
            pendingQuestion={pendingQuestion}
            onPendingQuestionConsumed={() => setPendingQuestion(null)}
            onHandbookSourceChange={setHandbookSource}
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

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 border-l border-gray-100 bg-gray-50/60 overflow-hidden">
        <Sidebar handbookSource={handbookSource} onSelect={handleSelect} />
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
              <Sidebar handbookSource={handbookSource} onSelect={handleSelect} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
