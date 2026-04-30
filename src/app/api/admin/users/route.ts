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
const ELEVATED_ROLES = ['manager', 'assistant_manager', 'admin'];

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
    .select('*, restaurants(name, slug), bar_cards!profile_id(id, expiration_date, archived)')
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

// POST /api/admin/users — Create a new team member
// Employees: PIN-based auth (name + 4-digit PIN)
// Managers / Asst. Managers: email + password (admin only)
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
  const { full_name, restaurant_id, role, pin, email, password, preferred_language, date_of_birth, welcome_until, requires_bar_card } = body;

  if (!full_name || !restaurant_id) {
    return Response.json({ error: 'Name and restaurant are required' }, { status: 400 });
  }

  if (welcome_until && !/^\d{4}-\d{2}-\d{2}$/.test(welcome_until)) {
    return Response.json({ error: 'welcome_until must be in YYYY-MM-DD format' }, { status: 400 });
  }

  // Default: highlight new staff for 30 days unless caller explicitly passed null/empty
  // (welcome_until === null disables auto-highlight; undefined = use default)
  let resolvedWelcomeUntil: string | null;
  if (welcome_until === null) {
    resolvedWelcomeUntil = null;
  } else if (welcome_until) {
    resolvedWelcomeUntil = welcome_until;
  } else {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    resolvedWelcomeUntil = d.toISOString().split('T')[0];
  }

  // date_of_birth (optional): require YYYY-MM-DD if provided
  if (date_of_birth && !/^\d{4}-\d{2}-\d{2}$/.test(date_of_birth)) {
    return Response.json({ error: 'Date of birth must be in YYYY-MM-DD format' }, { status: 400 });
  }

  const targetRole = role || 'employee';
  const isElevatedRole = ELEVATED_ROLES.includes(targetRole);

  // Only admins can create manager-level accounts
  if (isElevatedRole && me.role !== 'admin') {
    return Response.json({ error: 'Only admins can create manager accounts' }, { status: 403 });
  }

  // Managers/assistant managers can only add employees to their own restaurant
  if (me.role !== 'admin') {
    if (targetRole !== 'employee') {
      return Response.json({ error: 'Managers can only create employee accounts' }, { status: 403 });
    }
    if (restaurant_id !== me.restaurant_id) {
      return Response.json({ error: 'Managers can only add staff to their own restaurant' }, { status: 403 });
    }
  }

  const adminClient = getAdminClient();

  // ── EMPLOYEE: PIN-based auth ──────────────────────────────────────────────
  if (targetRole === 'employee') {
    if (!pin || !/^\d{4,8}$/.test(pin)) {
      return Response.json({ error: 'PIN must be 4 to 8 digits' }, { status: 400 });
    }

    const staffId = randomUUID();
    const staffEmail = `${staffId}@whg.staff`;
    const staffPassword = `WHG${pin}!staff`;

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      id: staffId,
      email: staffEmail,
      password: staffPassword,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (authError) return Response.json({ error: authError.message }, { status: 400 });

    const profilePayload: Record<string, unknown> = {
      id: authData.user.id,
      full_name,
      restaurant_id,
      role: 'employee',
      status: 'active',
      employee_pin: pin,
      preferred_language: preferred_language || 'en',
    };
    if (date_of_birth) profilePayload.date_of_birth = date_of_birth;
    if (resolvedWelcomeUntil !== null) profilePayload.welcome_until = resolvedWelcomeUntil;
    if (typeof requires_bar_card === 'boolean') profilePayload.requires_bar_card = requires_bar_card;

    const { error: profileError } = await adminClient.from('profiles').insert(profilePayload);

    if (profileError) {
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return Response.json({ error: profileError.message }, { status: 400 });
    }

    return Response.json({ success: true }, { status: 201 });
  }

  // ── MANAGER / ASST. MANAGER / ADMIN: email + password ────────────────────
  if (!email || !password) {
    return Response.json({ error: 'Email and password are required for manager accounts' }, { status: 400 });
  }

  if (password.length < 8) {
    return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });

  if (authError) return Response.json({ error: authError.message }, { status: 400 });

  const profilePayload: Record<string, unknown> = {
    id: authData.user.id,
    full_name,
    restaurant_id,
    role: targetRole,
    status: 'active',
    preferred_language: preferred_language || 'en',
  };
  if (date_of_birth) profilePayload.date_of_birth = date_of_birth;
  if (resolvedWelcomeUntil !== null) profilePayload.welcome_until = resolvedWelcomeUntil;

  const { error: profileError } = await adminClient.from('profiles').insert(profilePayload);

  if (profileError) {
    await adminClient.auth.admin.deleteUser(authData.user.id);
    return Response.json({ error: profileError.message }, { status: 400 });
  }

  return Response.json({ success: true }, { status: 201 });
}
