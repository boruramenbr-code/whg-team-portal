'use client';

import { useState } from 'react';
import PopularQuestions from './PopularQuestions';
import TopicBrowser from './TopicBrowser';

interface Props {
  handbookSource: 'employee' | 'manager';
  onSelect: (question: string) => void;
}

export default function Sidebar({ handbookSource, onSelect }: Props) {
  const [tab, setTab] = useState<'popular' | 'topics'>('topics');
  const isManager = handbookSource === 'manager';

  return (
    <div className="flex flex-col h-full">
      {/* Tab toggle */}
      <div className="flex border-b border-gray-100 flex-shrink-0">
        <button
          onClick={() => setTab('topics')}
          className={`flex-1 py-2.5 text-xs font-semibold transition-all ${
            tab === 'topics'
              ? isManager
                ? 'text-amber-700 border-b-2 border-amber-500 bg-amber-50/50'
                : 'text-[#1B3A6B] border-b-2 border-[#2E86C1] bg-[#EBF3FB]/50'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Topics
        </button>
        <button
          onClick={() => setTab('popular')}
          className={`flex-1 py-2.5 text-xs font-semibold transition-all ${
            tab === 'popular'
              ? isManager
                ? 'text-amber-700 border-b-2 border-amber-500 bg-amber-50/50'
                : 'text-[#1B3A6B] border-b-2 border-[#2E86C1] bg-[#EBF3FB]/50'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Popular
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'topics' ? (
          <TopicBrowser handbookSource={handbookSource} onSelect={onSelect} />
        ) : (
          <PopularQuestions onSelect={onSelect} />
        )}
      </div>
    </div>
  );
}
