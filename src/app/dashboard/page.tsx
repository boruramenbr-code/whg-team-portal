import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import DashboardClient from '@/components/DashboardClient';
import Header from '@/components/Header';

export default async function DashboardPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, restaurants(*)')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/');

  if (profile.status === 'archived') redirect('/?error=account_archived');

  const isManager = profile.role === 'manager' || profile.role === 'admin';

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header profile={profile} showAdminLink={isManager} currentPage="chat" />
      <DashboardClient profile={profile} isManager={isManager} />
    </div>
  );
}
