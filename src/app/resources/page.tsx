import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import ResourcesDashboard from '@/components/ResourcesDashboard';
import Header from '@/components/Header';

/**
 * Manager Resources — the learning half of the manager zone (Manager Bible,
 * Academy, calculators). Same people as Mission Control: Managers, AMs, KMs
 * and Assistant KMs (by role), plus ownership.
 */
export default async function ResourcesPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, restaurants(*)')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'manager', 'assistant_manager'].includes(profile.role)) {
    redirect('/dashboard');
  }

  if (profile.status === 'archived') {
    await supabase.auth.signOut();
    redirect('/');
  }

  return (
    <div className="mc-theme flex flex-col h-screen overflow-hidden bg-whg-night">
      <Header profile={profile} currentPage="resources" />
      <ResourcesDashboard profile={profile} />
    </div>
  );
}
