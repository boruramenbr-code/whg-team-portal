'use client';

import { useState } from 'react';
import { Profile } from '@/lib/types';
import ChatInterface from './ChatInterface';
import PopularQuestions from './PopularQuestions';

interface Props {
  profile: Profile;
  isManager: boolean;
}

export default function DashboardClient({ profile, isManager }: Props) {
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Chat — main area */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <div className="max-w-2xl w-full mx-auto h-full flex flex-col">
          <ChatInterface
            profile={profile}
            pendingQuestion={pendingQuestion}
            onPendingQuestionConsumed={() => setPendingQuestion(null)}
          />
        </div>
      </main>

      {/* Popular Questions Sidebar — desktop only */}
      <aside className="hidden lg:block w-64 flex-shrink-0 border-l border-gray-100 bg-gray-50/60 overflow-y-auto">
        <PopularQuestions onSelect={(q) => setPendingQuestion(q)} />
      </aside>
    </div>
  );
}
