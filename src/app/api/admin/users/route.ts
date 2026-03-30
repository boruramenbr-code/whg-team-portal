import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';

// Admin client uses service role key — SERVER ONLY
function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const MANAGER_ROLES = ['admin', 'manager', 'assistant_manager'];

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

  if (!me || !MANAGER_ROLES.includes(me.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const status = req.nextUrl.searchParams.get('status') || 'active';

  let query = supabase
    .from('profiles')
    .select('*, restaurants(name, slug)')
    .eq('status', status)
    .order('full_name');

  // Managers and assistant managers only see their own restaurant
  if (me.role !== 'admin') {
    query = query.eq('restaurant_id', me.restaurant_id);
  }

  const { data: users, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ users });
}

// POST /api/admin/users — Create a new team member using PIN
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: me } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!me || !MANAGER_ROLES.includes(me.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { full_name, pin, restaurant_id, role } = body;

  if (!full_name || !pin || !restaurant_id) {
    return Response.json({ error: 'Name, PIN, and restaurant are required' }, { status: 400 });
  }

  // Validate PIN format
  if (!/^\d{4}$/.test(pin)) {
    return Response.json({ error: 'PIN must be exactly 4 digits' }, { status: 400 });
  }

  // Managers and assistant managers can only add employees to their own restaurant
  if (me.role !== 'admin') {
    if (role && role !== 'employee') {
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

  // Pre-generate a UUID to use as both user ID and email prefix
  const staffId = randomUUID();
  const email = `${staffId}@whg.staff`;
  const password = `WHG${pin}!staff`;

  // Create Supabase auth user with pre-specified ID
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    id: staffId,
    email,
    password,
    email_confirm: true,
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
    employee_pin: pin,
  });

  if (profileError) {
    // Roll back auth user if profile creation failed
    await adminClient.auth.admin.deleteUser(authData.user.id);
    return Response.json({ error: profileError.message }, { status: 400 });
  }

  return Response.json({ success: true }, { status: 201 });
}
