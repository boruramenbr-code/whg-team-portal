'use client';

import { useState } from 'react';
import PopularQuestions from './PopularQuestions';
import TopicBrowser from './TopicBrowser';

interface Props {
  handbookSource: 'employee' | 'manager';
  onSelect: (question: string) => void;
  language: 'en' | 'es';
}

export default function Sidebar({ handbookSource, onSelect, language }: Props) {
  const [tab, setTab] = useState<'popular' | 'topics'>('topics');
  const isManager = handbookSource === 'manager';
  const isSpanish = language === 'es';

  return (
    <div className="flex flex-col h-full">
      {/* Tab toggle */}
      <div className="flex border-b border-whg-line flex-shrink-0">
        <button
          onClick={() => setTab('topics')}
          className={`flex-1 py-2.5 text-xs font-semibold transition-all ${
            tab === 'topics'
              ? isManager
                ? 'text-amber-300 border-b-2 border-amber-400 bg-amber-400/10'
                : 'text-whg-gold border-b-2 border-whg-gold bg-whg-gold/10'
              : 'text-whg-dim/70 hover:text-whg-dim'
          }`}
        >
          {isSpanish ? 'Temas' : 'Topics'}
        </button>
        <button
          onClick={() => setTab('popular')}
          className={`flex-1 py-2.5 text-xs font-semibold transition-all ${
            tab === 'popular'
              ? isManager
                ? 'text-amber-300 border-b-2 border-amber-400 bg-amber-400/10'
                : 'text-whg-gold border-b-2 border-whg-gold bg-whg-gold/10'
              : 'text-whg-dim/70 hover:text-whg-dim'
          }`}
        >
          {isSpanish ? 'Popular' : 'Popular'}
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'topics' ? (
          <TopicBrowser handbookSource={handbookSource} onSelect={onSelect} language={language} />
        ) : (
          <PopularQuestions onSelect={onSelect} language={language} />
        )}
      </div>
    </div>
  );
}
