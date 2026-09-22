import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import AdminDashboard from '@/components/AdminDashboard';
import Header from '@/components/Header';

export default async function AdminPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  // Profile + active restaurants (for the form dropdowns) side by side.
  const [{ data: profile }, { data: restaurants }] = await Promise.all([
    supabase
      .from('profiles')
      .select('*, restaurants(*)')
      .eq('id', user.id)
      .single(),
    supabase
      .from('restaurants')
      .select('*')
      .not('is_active', 'eq', false)
      .order('name'),
  ]);

  if (!profile || !['admin', 'manager', 'assistant_manager'].includes(profile.role)) {
    redirect('/dashboard');
  }

  if (profile.status === 'archived') {
    await supabase.auth.signOut();
    redirect('/');
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#C5D3E2]">
      <Header
        profile={profile}
        currentPage="admin"
      />
      <AdminDashboard
        profile={profile}
        restaurants={restaurants || []}
      />
    </div>
  );
}
