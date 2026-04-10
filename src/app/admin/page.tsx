import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import AdminPanel from '@/components/AdminPanel';
import PreshiftEditor from '@/components/PreshiftEditor';
import OwnerMessageEditor from '@/components/OwnerMessageEditor';
import Header from '@/components/Header';

export default async function AdminPage() {
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

  // Fetch all active restaurants for the form dropdowns
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('*')
    .not('is_active', 'eq', false)
    .order('name');

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header
        profile={profile}
        currentPage="admin"
      />
      <main className="flex-1">
        {/* Pre-Shift Notes Editor + Owner's Message (admin only) */}
        <div className="max-w-3xl mx-auto px-4 md:px-6 pt-4 md:pt-6 space-y-4">
          <PreshiftEditor
            isAdmin={profile.role === 'admin'}
            restaurants={profile.role === 'admin' ? (restaurants || []) : undefined}
          />
          {profile.role === 'admin' && <OwnerMessageEditor />}
        </div>

        {/* Team Management (has its own max-w container) */}
        <AdminPanel
          currentUser={profile}
          restaurants={restaurants || []}
        />
      </main>
    </div>
  );
}
