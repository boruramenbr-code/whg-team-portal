'use client';

import { useEffect, useState } from 'react';

interface PopularQuestion {
  question: string;
  count: number;
}

interface Props {
  onSelect: (question: string) => void;
}

export default function PopularQuestions({ onSelect }: Props) {
  const [questions, setQuestions] = useState<PopularQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/popular-questions')
      .then((r) => r.json())
      .then((data) => {
        if (data.questions) setQuestions(data.questions);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-5 bg-[#2E86C1] rounded-full" />
        <h3 className="text-xs font-bold text-[#1B3A6B] uppercase tracking-wider">
          Staff Are Asking
        </h3>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : questions.length === 0 ? (
        <p className="text-xs text-gray-400 text-center mt-8">
          No questions yet — be the first to ask!
        </p>
      ) : (
        <div className="space-y-2">
          {questions.map(({ question, count }, i) => (
            <button
              key={i}
              onClick={() => onSelect(question)}
              className="w-full text-left group"
            >
              <div className="px-3 py-2.5 bg-white border border-gray-100 rounded-xl hover:border-[#2E86C1] hover:bg-[#EBF3FB] transition-all shadow-sm">
                <p className="text-xs text-gray-700 group-hover:text-[#1B3A6B] leading-snug line-clamp-2">
                  {question}
                </p>
                {count > 1 && (
                  <span className="inline-block mt-1 text-[10px] text-[#2E86C1] font-semibold">
                    Asked {count}×
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <p className="text-[10px] text-gray-400 text-center mt-4">
        Click any question to ask it
      </p>
    </div>
  );
}
