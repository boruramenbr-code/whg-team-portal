import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import ChatInterface from '@/components/ChatInterface';
import Header from '@/components/Header';

export default async function DashboardPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*, restaurants(*)')
    .eq('id', user.id)
    .single();

  console.log('[Dashboard] user.id:', user.id);
  console.log('[Dashboard] profile:', profile);
  console.log('[Dashboard] profileError:', profileError);

  if (!profile) {
    // Profile doesn't exist — redirect without signing out so we can debug session
    redirect('/?error=no_profile');
  }

  if (profile.status === 'archived') {
    redirect('/?error=account_archived');
  }

  const isManager = profile.role === 'manager' || profile.role === 'admin';

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header
        profile={profile}
        showAdminLink={isManager}
        currentPage="chat"
      />
      <main className="flex-1 overflow-hidden max-w-2xl w-full mx-auto flex flex-col">
        <ChatInterface profile={profile} />
      </main>
    </div>
  );
}
