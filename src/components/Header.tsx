'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Profile } from '@/lib/types';

const HEADER_LOGO: Record<string, { src: string; mobileH: string; desktopH: string }> = {
  'Ichiban Sushi': { src: '/logos/ichiban-white.png', mobileH: 'h-9', desktopH: 'md:h-7' },
  'Boru Ramen': { src: '/logos/boru-white.png', mobileH: 'h-7', desktopH: 'md:h-6' },
  'Shokudo': { src: '/logos/shokudo-white.png', mobileH: 'h-7', desktopH: 'md:h-6' },
};

interface HeaderProps {
  profile: Profile & { restaurants?: { name: string } };
  /** Managers, AMs, KMs, Assistant KMs and Sushi Managers — shows the Managers button. */
  showAdminLink?: boolean;
  /** 'admin' = Mission Control, 'resources' = Manager Resources (the manager zone). */
  currentPage?: 'chat' | 'admin' | 'resources';
}

const ZONE_LABEL = { chat: 'Team Portal', admin: 'Mission Control', resources: 'Manager Resources' } as const;

export default function Header({ profile, showAdminLink, currentPage = 'chat' }: HeaderProps) {
  const router = useRouter();
  const inManagerZone = currentPage === 'admin' || currentPage === 'resources';
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <header className="relative bg-whg-night border-b border-whg-line text-whg-snow px-4 py-3 md:py-3 flex items-center justify-between flex-shrink-0" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0.75rem))' }}>
      {/* Left: Brand */}
      <div className="flex items-center gap-3">
        {inManagerZone && (
          <button
            onClick={() => router.push('/dashboard')}
            className="tap-highlight text-whg-dim hover:text-whg-gold mr-1 transition-colors p-1"
            aria-label="Back to portal"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logos/whg.jpg"
            alt="Wong Hospitality Group"
            className="h-10 md:h-9 w-auto object-contain rounded"
          />
          {profile.restaurants?.name && HEADER_LOGO[profile.restaurants.name] && (
            <>
              <span className="w-px h-6 bg-whg-line" aria-hidden />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={HEADER_LOGO[profile.restaurants.name].src}
                alt={`${profile.restaurants.name} logo`}
                className={`${HEADER_LOGO[profile.restaurants.name].mobileH} ${HEADER_LOGO[profile.restaurants.name].desktopH} w-auto object-contain opacity-90`}
              />
            </>
          )}
          <span className="text-whg-dim text-xs hidden sm:inline">
            {ZONE_LABEL[currentPage]}
          </span>
        </div>
      </div>

      {/* Right: User info + actions */}
      <div className="flex items-center gap-2.5 md:gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-semibold leading-tight">{profile.full_name}</p>
          <p className="text-[10px] text-whg-dim leading-tight">
            {profile.restaurants?.name || '—'}
          </p>
        </div>

        {showAdminLink && !inManagerZone && (
          <div>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className="tap-highlight flex items-center gap-1.5 text-sm md:text-xs bg-whg-gold/15 hover:bg-whg-gold/25 text-whg-gold border border-whg-gold/35 px-3.5 py-2 md:px-3 md:py-1.5 rounded-lg transition-colors font-semibold"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="8" cy="15" r="4" /><path d="M11 12l9-9M17 6l3 3M15 8l2 2" />
              </svg>
              Managers
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={`transition-transform ${menuOpen ? 'rotate-180' : ''}`}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {menuOpen && (
              <>
                <button aria-label="Close menu" className="fixed inset-0 z-40 cursor-default" onClick={() => setMenuOpen(false)} />
                {/* Anchored to the header (not the button) so it never runs off a phone's left edge. */}
                <div role="menu" className="absolute left-3 right-3 top-full mt-1.5 md:left-auto md:right-4 md:w-80 z-50 rounded-2xl bg-whg-card border border-whg-line shadow-2xl p-2 space-y-1.5">
                  <p className="px-2 pt-1 pb-0.5 text-[10px] font-bold uppercase tracking-widest text-whg-dim">Manager zone</p>
                  <button
                    role="menuitem"
                    onClick={() => { setMenuOpen(false); router.push('/admin'); }}
                    className="tap-highlight w-full flex items-center gap-3 p-3 rounded-xl text-left bg-[#141518] border border-[#3A3222] hover:border-whg-gold/60 transition-colors"
                  >
                    <span className="w-9 h-9 flex-shrink-0 rounded-lg bg-whg-gold flex items-center justify-center">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1E1608" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
                      </svg>
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-whg-gold2">Mission Control</span>
                      <span className="block text-[11px] leading-snug text-[#9A9690]">Run the restaurant: staff, pre-shift, onboarding, bar cards, pay rates.</span>
                    </span>
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => { setMenuOpen(false); router.push('/resources'); }}
                    className="tap-highlight w-full flex items-center gap-3 p-3 rounded-xl text-left bg-whg-night border border-whg-line hover:border-whg-gold/50 transition-colors"
                  >
                    <span className="w-9 h-9 flex-shrink-0 rounded-lg bg-whg-gold/15 border border-whg-gold/40 flex items-center justify-center">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D9A94E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" /><path d="M4 5.5v16M8 7h8M8 11h6" />
                      </svg>
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-whg-snow">Manager Resources</span>
                      <span className="block text-[11px] leading-snug text-whg-dim">Learn it and look it up: Manager Bible, Academy, videos, calculators.</span>
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <button
          onClick={handleSignOut}
          className="tap-highlight text-sm md:text-xs text-whg-dim hover:text-whg-snow transition-colors py-1"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
