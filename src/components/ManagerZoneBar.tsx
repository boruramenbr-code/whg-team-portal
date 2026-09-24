'use client';

import Link from 'next/link';

/**
 * The gold band across the top of the manager zone (Charcoal & Gold,
 * Sept 2026). Says where you are on every screen — so a manager never
 * mistakes Mission Control for the staff app — and hops to the other room.
 */
export default function ManagerZoneBar({ zone }: { zone: 'mission-control' | 'resources' }) {
  const isMC = zone === 'mission-control';
  return (
    <div className="flex-shrink-0 flex items-center justify-between gap-3 px-3 md:px-6 py-1.5 bg-gradient-to-r from-whg-gold to-[#B8893A] text-whg-goldink">
      <p className="flex items-center gap-2 text-[10px] md:text-[11px] font-extrabold uppercase tracking-[0.22em]">
        {isMC ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" /><path d="M4 5.5v16" />
          </svg>
        )}
        {isMC ? 'Mission Control' : 'Manager Resources'}
      </p>
      <Link
        href={isMC ? '/resources' : '/admin'}
        className="tap-highlight flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-black/15 hover:bg-black/25 transition-colors"
      >
        {isMC ? 'Manager Resources' : 'Mission Control'}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polyline points="9 6 15 12 9 18" />
        </svg>
      </Link>
    </div>
  );
}
