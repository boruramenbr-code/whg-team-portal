import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// PATCH /api/admin/users/[id] — Update status or role
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: me } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!me || !['admin', 'manager'].includes(me.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const adminClient = getAdminClient();

  // Managers can only update employees at their restaurant
  if (me.role === 'manager') {
    const { data: target } = await supabase
      .from('profiles')
      .select('restaurant_id, role')
      .eq('id', params.id)
      .single();

    if (!target || target.restaurant_id !== me.restaurant_id || target.role !== 'employee') {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    // Managers cannot change roles
    if (body.role) {
      return Response.json({ error: 'Managers cannot change roles' }, { status: 403 });
    }
  }

  // If archiving, invalidate their active sessions immediately
  if (body.status === 'archived') {
    await adminClient.auth.admin.signOut(params.id, 'global');
  }

  const { error } = await adminClient
    .from('profiles')
    .update(body)
    .eq('id', params.id);

  if (error) return Response.json({ error: error.message }, { status: 400 });

  return Response.json({ success: true });
}
