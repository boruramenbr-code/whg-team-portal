'use client';

import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Profile } from '@/lib/types';

interface HeaderProps {
  profile: Profile & { restaurants?: { name: string } };
  showAdminLink?: boolean;
  currentPage?: 'chat' | 'admin';
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
    <header className="bg-[#1B3A6B] text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
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
        <div>
          <span className="font-bold text-base tracking-tight">WHG</span>
          <span className="text-[#7BA7D3] text-xs ml-1.5">
            {currentPage === 'admin' ? 'Team Management' : 'Team Portal'}
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
            Manage Team
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
