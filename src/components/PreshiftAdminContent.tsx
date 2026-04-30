'use client';

import { useState } from 'react';
import { Restaurant } from '@/lib/types';
import PreshiftEditor from './PreshiftEditor';
import OwnerMessageEditor from './OwnerMessageEditor';
import WelcomeNoteEditor from './WelcomeNoteEditor';
import HolidaysEditor from './HolidaysEditor';

interface Props {
  isAdmin: boolean;
  restaurants: Restaurant[];
}

type SubTab = 'preshift' | 'owner' | 'welcome' | 'holidays';

interface Pill {
  key: SubTab;
  label: string;
  emoji: string;
  adminOnly?: boolean;
  description?: string;
}

const PILLS: Pill[] = [
  { key: 'preshift',  label: 'Pre-Shift Notes', emoji: '📋', description: 'Daily specials, 86\'d items, focus' },
  { key: 'owner',     label: "Owner's Message", emoji: '💙', adminOnly: true, description: 'Rotating leadership notes from ownership' },
  { key: 'welcome',   label: 'Welcome Note',    emoji: '📌', description: 'Yellow sticky note shown on every staff member\'s first login' },
  { key: 'holidays',  label: 'Holidays & Events', emoji: '📅', description: 'Closures, busy/slow days, and upcoming events. Shown on the home tab.' },
];

/**
 * Pre-shift admin tab — split into sub-pills so each editor has its own surface
 * instead of all stacked vertically. Pills are filtered by role (admin-only
 * editors hide their pill when a non-admin is viewing).
 */
export default function PreshiftAdminContent({ isAdmin, restaurants }: Props) {
  const [subTab, setSubTab] = useState<SubTab>('preshift');
  const visiblePills = PILLS.filter((p) => !p.adminOnly || isAdmin);

  // Defensive: if somehow stuck on a hidden pill, fall back to first visible
  const currentPill = visiblePills.find((p) => p.key === subTab) || visiblePills[0];
  const activeKey: SubTab = currentPill?.key || 'preshift';

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-4 md:py-6 space-y-4 tab-content-enter">
      {/* Sub-tab pills */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-blue-50/50">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
            Edit
          </p>
          <div className="flex flex-wrap gap-2">
            {visiblePills.map((p) => {
              const isActive = activeKey === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => setSubTab(p.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#1B3A6B] text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span>{p.emoji}</span>
                  {p.label}
                  {p.adminOnly && (
                    <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'
                    }`}>
                      Owner
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {currentPill?.description && (
            <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">{currentPill.description}</p>
          )}
        </div>
      </div>

      {/* Active editor */}
      {activeKey === 'preshift' && (
        <PreshiftEditor
          isAdmin={isAdmin}
          restaurants={isAdmin ? restaurants : undefined}
        />
      )}
      {activeKey === 'owner' && isAdmin && <OwnerMessageEditor />}
      {activeKey === 'welcome' && <WelcomeNoteEditor />}
      {activeKey === 'holidays' && <HolidaysEditor restaurants={restaurants} />}
    </div>
  );
}
