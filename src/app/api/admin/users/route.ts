import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

// Admin client uses service role key — SERVER ONLY
function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// GET /api/admin/users?status=active|archived
export async function GET(req: NextRequest) {
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

  const status = req.nextUrl.searchParams.get('status') || 'active';

  let query = supabase
    .from('profiles')
    .select('*, restaurants(name, slug)')
    .eq('status', status)
    .order('full_name');

  // Managers only see their own restaurant
  if (me.role === 'manager') {
    query = query.eq('restaurant_id', me.restaurant_id);
  }

  const { data: users, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ users });
}

// POST /api/admin/users — Create a new team member
export async function POST(req: NextRequest) {
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
  const { full_name, email, password, restaurant_id, role } = body;

  // Managers can only add employees to their own restaurant
  if (me.role === 'manager') {
    if (role !== 'employee') {
      return Response.json(
        { error: 'Managers can only create employee accounts' },
        { status: 403 }
      );
    }
    if (restaurant_id !== me.restaurant_id) {
      return Response.json(
        { error: 'Managers can only add staff to their own restaurant' },
        { status: 403 }
      );
    }
  }

  const adminClient = getAdminClient();

  // Create Supabase auth user
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Skip email verification — manager sets credentials
    user_metadata: { full_name },
  });

  if (authError) {
    return Response.json({ error: authError.message }, { status: 400 });
  }

  // Create profile row
  const { error: profileError } = await adminClient.from('profiles').insert({
    id: authData.user.id,
    full_name,
    restaurant_id,
    role: role || 'employee',
    status: 'active',
  });

  if (profileError) {
    // Roll back auth user if profile creation failed
    await adminClient.auth.admin.deleteUser(authData.user.id);
    return Response.json({ error: profileError.message }, { status: 400 });
  }

  return Response.json({ success: true }, { status: 201 });
}
