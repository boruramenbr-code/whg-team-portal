'use client';

import { useState } from 'react';
import { Profile } from '@/lib/types';
import HandbookReaderTab from './HandbookReaderTab';
import ChatInterface from './ChatInterface';

interface Props {
  profile: Profile;
}

type SubView = 'about' | 'read' | 'ask';

/**
 * Manager Handbook Bible — admin-only Read + Ask interface.
 *
 * Surfaces handbook_sections rows where role_visibility is 'manager' or 'all',
 * scoped via the new ?audience=manager query param. Chat is locked to the
 * manager handbook source via forceSource="manager".
 *
 * Three sub-views:
 *   • About — explanation of what the Bible is and how to use it
 *   • Read  — browse sections (reuses HandbookReaderTab with audience='manager')
 *   • Ask   — chatbot scoped to manager content (forceSource='manager')
 */
export default function ManagerBibleTab({ profile }: Props) {
  const [view, setView] = useState<SubView>('about');
  const [language, setLanguage] = useState<'en' | 'es'>(profile.preferred_language || 'en');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header + sub-tab pills */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-3">
          <div className="flex items-center justify-between gap-3 mb-2">
            <h2 className="text-lg font-bold text-[#1B3A6B] flex items-center gap-2">
              <span>📖</span> Manager Handbook Bible
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-widest bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
              Manager only
            </span>
          </div>
          <div className="flex gap-2">
            {([
              { key: 'about', label: 'ℹ️ About', desc: 'What this is' },
              { key: 'read', label: '📑 Read', desc: 'Browse sections' },
              { key: 'ask', label: '💬 Ask', desc: 'Chat with the Bible' },
            ] as const).map((p) => (
              <button
                key={p.key}
                onClick={() => setView(p.key as SubView)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  view === p.key
                    ? 'bg-[#1B3A6B] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active view — must be flex flex-col so children with flex-1 (HandbookReaderTab,
          ChatInterface) get a proper flex parent and can size + scroll correctly. */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {view === 'about' && <AboutBibleView />}
        {view === 'read' && (
          <HandbookReaderTab language={language} audience="manager" />
        )}
        {view === 'ask' && (
          <ChatInterface
            profile={profile}
            language={language}
            onLanguageChange={setLanguage}
            forceSource="manager"
          />
        )}
      </div>
    </div>
  );
}

/* ───────── About view ───────── */
function AboutBibleView() {
  return (
    <div className="overflow-y-auto h-full bg-gradient-to-b from-[#C5D3E2] to-[#D5E0EB]">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-4 tab-content-enter">
        {/* Hero */}
        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 border border-gray-200">
          <div className="text-3xl mb-3">📖</div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1B3A6B] mb-2">
            Welcome to the Manager Handbook Bible
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            Your reference for handling tough conversations and gray-area questions about the staff handbook.
            When a server asks you something you&apos;re not sure how to answer, this is where you look first.
          </p>
        </div>

        {/* What it is */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200">
          <h2 className="text-sm font-bold text-[#1B3A6B] uppercase tracking-wide mb-2">
            What it is
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            The staff handbook tells your team <strong>what</strong> the policies are.
            The Manager Handbook Bible tells you, the manager, <strong>how to handle them</strong> —
            how to coach a struggling employee, how to escalate a guest complaint, how to navigate
            tough situations that the rules don&apos;t spell out perfectly.
          </p>
          <p className="text-sm text-gray-700 leading-relaxed mt-2">
            It&apos;s a complement to the staff handbook, not a replacement. Staff cannot see this content —
            it&apos;s exclusively for ownership, managers, and assistant managers.
          </p>
        </div>

        {/* How to use */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200">
          <h2 className="text-sm font-bold text-[#1B3A6B] uppercase tracking-wide mb-3">
            How to use it
          </h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex gap-3">
              <span className="text-xl flex-shrink-0">📑</span>
              <div>
                <p className="font-bold text-gray-800">Read</p>
                <p className="leading-relaxed">
                  Browse manager-only sections covering common scenarios, escalation paths,
                  and how to coach staff through gray areas. Search, jump to topics, scan when you have a minute.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-xl flex-shrink-0">💬</span>
              <div>
                <p className="font-bold text-gray-800">Ask</p>
                <p className="leading-relaxed">
                  Have a conversation. Type a real situation you&apos;re facing — &quot;A server skipped pre-shift
                  three times this week, what&apos;s the right move?&quot; — and the AI answers based on
                  the Bible content. Use it before, during, or after a tough conversation.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Coverage / what to expect */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-amber-900 uppercase tracking-wide mb-2">
            ⚠️ A note on coverage
          </h2>
          <p className="text-sm text-amber-900 leading-relaxed">
            The Bible grows over time. Right now it covers what we&apos;ve already documented — common
            policies and a few core scenarios. Keep adding content as you encounter situations the
            current Bible doesn&apos;t handle, so the next manager doesn&apos;t have to figure it out from scratch.
          </p>
          <p className="text-sm text-amber-900 leading-relaxed mt-2">
            When the AI doesn&apos;t know the answer, it&apos;ll say so. That&apos;s a signal we&apos;re missing
            content — flag it to ownership and we&apos;ll add it.
          </p>
        </div>

        {/* Getting started */}
        <div className="bg-[#1B3A6B] text-white rounded-2xl p-6">
          <h2 className="text-sm font-bold uppercase tracking-wide mb-2 text-amber-300">
            Get started
          </h2>
          <p className="text-sm leading-relaxed mb-4">
            Tap <strong>📑 Read</strong> to browse the current Bible content, or jump straight to
            <strong> 💬 Ask</strong> if you have a specific situation you&apos;re working through.
          </p>
          <p className="text-xs text-white/70 italic">
            This is your playbook. Use it whenever you need it.
          </p>
        </div>
      </div>
    </div>
  );
}
