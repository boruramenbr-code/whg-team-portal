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

const MANAGER_ROLES = ['admin', 'manager', 'assistant_manager'];

// PATCH /api/admin/users/[id] — Update status, role, or reset PIN
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

  if (!me || !MANAGER_ROLES.includes(me.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const adminClient = getAdminClient();

  // Managers and assistant managers can only update employees at their own restaurant
  if (me.role !== 'admin') {
    const { data: target } = await supabase
      .from('profiles')
      .select('restaurant_id, role')
      .eq('id', params.id)
      .single();

    if (!target || target.restaurant_id !== me.restaurant_id || target.role !== 'employee') {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    // Managers cannot change roles
    if (body.role !== undefined) {
      return Response.json({ error: 'Managers cannot change roles' }, { status: 403 });
    }
  }

  // Handle PIN reset — update auth password and profile PIN
  if (body.pin !== undefined) {
    if (!/^\d{4,8}$/.test(body.pin)) {
      return Response.json({ error: 'PIN must be 4 to 8 digits' }, { status: 400 });
    }

    const newPassword = `WHG${body.pin}!staff`;
    const { error: pwError } = await adminClient.auth.admin.updateUserById(params.id, {
      password: newPassword,
    });

    if (pwError) return Response.json({ error: pwError.message }, { status: 400 });

    // Update stored PIN in profile
    const { error: pinError } = await adminClient
      .from('profiles')
      .update({ employee_pin: body.pin })
      .eq('id', params.id);

    if (pinError) return Response.json({ error: pinError.message }, { status: 400 });

    return Response.json({ success: true });
  }

  // Handle direct password reset (managers / admins / asst managers)
  // Admin-only — caller already verified above. Reject for employee targets
  // because employees authenticate via PIN-derived passwords.
  if (body.password !== undefined) {
    if (me.role !== 'admin') {
      return Response.json({ error: 'Only admins can reset manager passwords' }, { status: 403 });
    }
    if (typeof body.password !== 'string' || body.password.length < 8) {
      return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const { data: target } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', params.id)
      .single();

    if (!target) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    if (target.role === 'employee') {
      return Response.json(
        { error: 'Employees authenticate by PIN — use Reset PIN instead.' },
        { status: 400 }
      );
    }

    const { error: pwError } = await adminClient.auth.admin.updateUserById(params.id, {
      password: body.password,
    });

    if (pwError) return Response.json({ error: pwError.message }, { status: 400 });

    // Force a sign-out of all existing sessions so the old password can't keep working.
    await adminClient.auth.admin.signOut(params.id, 'global');

    return Response.json({ success: true });
  }

  // If archiving, immediately invalidate all active sessions
  if (body.status === 'archived') {
    await adminClient.auth.admin.signOut(params.id, 'global');
  }

  // Build profile update — strip 'pin' and 'password' keys (handled separately above via auth password update)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { pin: _ignoredPin, password: _ignoredPw, ...profileUpdate } = body;

  const { error } = await adminClient
    .from('profiles')
    .update(profileUpdate)
    .eq('id', params.id);

  if (error) return Response.json({ error: error.message }, { status: 400 });

  return Response.json({ success: true });
}
