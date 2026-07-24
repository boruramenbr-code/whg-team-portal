'use client';

import { ButtonHTMLAttributes } from 'react';

/* ───────── Chip ─────────
 *
 * The filter/sub-tab pill used across every screen (Videos | Menu |
 * Quizzes, restaurant switchers, allergen filters). Social-media
 * muscle memory: horizontally scrollable row of pills, active one
 * filled. Wrap rows in <ChipRow> for the scroll behavior.
 */

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  /** Amber accent (owner/attention contexts) instead of navy. */
  tone?: 'navy' | 'amber';
}

export function Chip({ active = false, tone = 'navy', className = '', children, ...rest }: ChipProps) {
  const activeCls = tone === 'amber' ? 'bg-amber-500 text-white shadow-sm' : 'bg-whg-navy text-white shadow-sm';
  return (
    <button
      className={`tap-highlight flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-colors ${
        active ? activeCls : 'bg-white/70 text-gray-600 hover:bg-white'
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Horizontally scrollable pill row with hidden scrollbar. */
export function ChipRow({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`flex gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden ${className}`}>
      {children}
    </div>
  );
}
