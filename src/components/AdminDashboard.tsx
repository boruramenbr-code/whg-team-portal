'use client';

import { useState } from 'react';
import { Profile, Restaurant } from '@/lib/types';
import AdminPanel from './AdminPanel';
import PreshiftEditor from './PreshiftEditor';
import OwnerMessageEditor from './OwnerMessageEditor';

interface Props {
  profile: Profile;
  restaurants: Restaurant[];
}

type DashboardTab = 'staff' | 'preshift' | 'settings';

/* ── SVG icons for admin bottom nav ── */
const AdminNavIcons: Record<string, (active: boolean) => React.ReactNode> = {
  staff: (a) => (
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
  settings: (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? '#1B3A6B' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" fill={a ? '#1B3A6B' : 'none'} />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
};

export default function AdminDashboard({ profile, restaurants }: Props) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('staff');
  const isAdmin = profile.role === 'admin';

  const tabs: { key: DashboardTab; label: string; emoji: string; adminOnly?: boolean; disabled?: boolean }[] = [
    { key: 'staff', label: 'Staff', emoji: '👥' },
    { key: 'preshift', label: 'Pre-Shift', emoji: '📋' },
    ...(isAdmin
      ? [{ key: 'settings' as DashboardTab, label: 'Settings', emoji: '⚙️', adminOnly: true, disabled: true }]
      : []),
  ];

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* ── DESKTOP tab bar (hidden on mobile) ── */}
      <div className="hidden md:block border-b border-[#B8C5D4] bg-[#D0DAE5] px-6 flex-shrink-0">
        <div className="max-w-4xl mx-auto flex gap-1">
          {tabs.map((t) => {
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => !t.disabled && setActiveTab(t.key)}
                disabled={t.disabled}
                className={`relative flex items-center gap-1.5 px-5 py-3 text-sm font-semibold transition-colors ${
                  t.disabled
                    ? 'text-gray-300 cursor-not-allowed'
                    : isActive
                    ? 'text-[#1B3A6B]'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <span>{t.emoji}</span>
                <span>{t.label}</span>
                {t.disabled && (
                  <span className="text-[9px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full font-medium ml-1">
                    Soon
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1B3A6B] rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#C5D3E2] to-[#D5E0EB] pb-[72px] md:pb-0">
        {activeTab === 'staff' && (
          <div className="tab-content-enter">
            <AdminPanel
              currentUser={profile}
              restaurants={restaurants}
            />
          </div>
        )}

        {activeTab === 'preshift' && (
          <div className="max-w-3xl mx-auto px-4 md:px-6 py-4 md:py-6 space-y-4 tab-content-enter">
            <PreshiftEditor
              isAdmin={isAdmin}
              restaurants={isAdmin ? restaurants : undefined}
            />
            {isAdmin && <OwnerMessageEditor />}
          </div>
        )}

        {activeTab === 'settings' && isAdmin && (
          <div className="max-w-3xl mx-auto px-4 md:px-6 py-12 text-center tab-content-enter">
            <div className="text-4xl mb-3">⚙️</div>
            <h3 className="text-lg font-bold text-gray-400">Settings</h3>
            <p className="text-sm text-gray-400 mt-1">Coming soon — restaurant management, notifications, and more.</p>
          </div>
        )}
      </div>

      {/* ── MOBILE bottom navigation bar (hidden on desktop) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-around px-2 pt-1.5 pb-safe">
          {tabs.map((t) => {
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => !t.disabled && setActiveTab(t.key)}
                disabled={t.disabled}
                className={`tap-highlight flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg min-w-[60px] transition-colors ${
                  t.disabled
                    ? 'text-gray-300 opacity-50'
                    : isActive
                    ? 'text-[#1B3A6B]'
                    : 'text-gray-400'
                }`}
              >
                <div className="relative">
                  {AdminNavIcons[t.key]?.(isActive && !t.disabled) || <span className="text-lg">{t.emoji}</span>}
                  {isActive && !t.disabled && (
                    <span className="nav-dot-enter absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#1B3A6B]" />
                  )}
                </div>
                <span className={`text-[10px] font-semibold leading-tight ${isActive && !t.disabled ? 'text-[#1B3A6B]' : ''}`}>
                  {t.label}
                </span>
                {t.disabled && (
                  <span className="text-[8px] text-gray-300 -mt-0.5">Soon</span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
