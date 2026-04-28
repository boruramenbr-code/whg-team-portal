'use client';

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
  showAdminLink?: boolean;
  currentPage?: 'chat' | 'admin';
}

function getDashboardLabel(role: string): string {
  if (role === 'admin') return 'Mission Control';
  return 'Mission Control';
}

export default function Header({ profile, showAdminLink, currentPage }: HeaderProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <header className="bg-[#1B3A6B] text-white px-4 py-3 md:py-3 flex items-center justify-between flex-shrink-0" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0.75rem))' }}>
      {/* Left: Brand */}
      <div className="flex items-center gap-3">
        {currentPage === 'admin' && (
          <button
            onClick={() => router.push('/dashboard')}
            className="tap-highlight text-[#7BA7D3] hover:text-white mr-1 transition-colors p-1"
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
            src="/logos/whg.png"
            alt="Wong Hospitality Group"
            className="h-10 md:h-9 w-auto object-contain rounded"
          />
          {profile.restaurants?.name && HEADER_LOGO[profile.restaurants.name] && (
            <>
              <span className="text-[#7BA7D3]/40 text-sm">|</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={HEADER_LOGO[profile.restaurants.name].src}
                alt={`${profile.restaurants.name} logo`}
                className={`${HEADER_LOGO[profile.restaurants.name].mobileH} ${HEADER_LOGO[profile.restaurants.name].desktopH} w-auto object-contain opacity-90`}
              />
            </>
          )}
          <span className="text-[#7BA7D3] text-xs hidden sm:inline">
            {currentPage === 'admin' ? getDashboardLabel(profile.role) : 'Team Portal'}
          </span>
        </div>
      </div>

      {/* Right: User info + actions */}
      <div className="flex items-center gap-2.5 md:gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-semibold leading-tight">{profile.full_name}</p>
          <p className="text-[10px] text-[#7BA7D3] leading-tight">
            {profile.restaurants?.name || '—'}
          </p>
        </div>

        {showAdminLink && currentPage !== 'admin' && (
          <button
            onClick={() => router.push('/admin')}
            className="tap-highlight text-sm md:text-xs bg-white/15 hover:bg-white/25 px-4 py-2 md:px-3 md:py-1.5 rounded-lg transition-colors font-semibold"
          >
            Mission Control
          </button>
        )}

        <button
          onClick={handleSignOut}
          className="tap-highlight text-sm md:text-xs text-[#7BA7D3] hover:text-white transition-colors py-1"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
