'use client';

import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Profile } from '@/lib/types';

const HEADER_LOGO: Record<string, string> = {
  'Ichiban Sushi': '/logos/ichiban-white.png',
  'Boru Ramen': '/logos/boru-white.png',
  'Shokudo': '/logos/shokudo-white.png',
};

interface HeaderProps {
  profile: Profile & { restaurants?: { name: string } };
  showAdminLink?: boolean;
  currentPage?: 'chat' | 'admin';
}

function getDashboardLabel(role: string): string {
  if (role === 'admin') return 'Owner Dashboard';
  return 'Manager Dashboard';
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
    <header className="bg-[#1B3A6B] text-white px-4 py-3 flex items-center justify-between flex-shrink-0" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0.75rem))' }}>
      {/* Left: Brand */}
      <div className="flex items-center gap-3">
        {currentPage === 'admin' && (
          <button
            onClick={() => router.push('/dashboard')}
            className="text-[#7BA7D3] hover:text-white mr-1 transition-colors"
            aria-label="Back to chat"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logos/whg.png"
            alt="Wong Hospitality Group"
            className="h-8 w-auto object-contain rounded"
          />
          {profile.restaurants?.name && HEADER_LOGO[profile.restaurants.name] && (
            <>
              <span className="text-[#7BA7D3]/40 text-xs">|</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={HEADER_LOGO[profile.restaurants.name]}
                alt={`${profile.restaurants.name} logo`}
                className="h-5 w-auto object-contain opacity-90"
              />
            </>
          )}
          <span className="text-[#7BA7D3] text-xs hidden sm:inline">
            {currentPage === 'admin' ? getDashboardLabel(profile.role) : 'Team Portal'}
          </span>
        </div>
      </div>

      {/* Right: User info + actions */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-semibold leading-tight">{profile.full_name}</p>
          <p className="text-[10px] text-[#7BA7D3] leading-tight">
            {profile.restaurants?.name || '—'}
          </p>
        </div>

        {showAdminLink && currentPage !== 'admin' && (
          <button
            onClick={() => router.push('/admin')}
            className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors font-medium"
          >
            Dashboard
          </button>
        )}

        <button
          onClick={handleSignOut}
          className="text-xs text-[#7BA7D3] hover:text-white transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
