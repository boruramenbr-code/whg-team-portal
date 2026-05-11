import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * POST /api/onboarding/check
 * Body: {
 *   user_id: string,        // target employee (defaults to caller if omitted)
 *   item_id: string,        // checklist item to update
 *   column: 'employee' | 'manager',
 *   checked: boolean,       // true = mark checked now, false = un-check
 * }
 *
 * Authorization:
 *   • Employee can toggle their OWN employee column.
 *   • Manager/admin can toggle anyone's manager column.
 *   • Manager/admin can also toggle anyone's employee column (in case the
 *     employee forgot to mark it themselves).
 *
 * Upserts the (user_id, item_id) row in employee_onboarding_progress.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { user_id?: string; item_id?: string; column?: string; checked?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const targetUserId = body.user_id || user.id;
  const itemId = body.item_id;
  const column = body.column;
  const checked = body.checked;

  if (!itemId || typeof itemId !== 'string') {
    return NextResponse.json({ error: 'item_id is required' }, { status: 400 });
  }
  if (column !== 'employee' && column !== 'manager') {
    return NextResponse.json({ error: 'column must be "employee" or "manager"' }, { status: 400 });
  }
  if (typeof checked !== 'boolean') {
    return NextResponse.json({ error: 'checked must be a boolean' }, { status: 400 });
  }

  // Caller's role
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single();
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const isManager = ['manager', 'assistant_manager', 'admin'].includes(profile.role);
  const isSelf = targetUserId === user.id;

  if (column === 'manager' && !isManager) {
    return NextResponse.json({ error: 'Only managers can toggle the manager column' }, { status: 403 });
  }
  if (column === 'employee' && !isSelf && !isManager) {
    return NextResponse.json({ error: 'Cannot toggle another user\'s employee column' }, { status: 403 });
  }

  const admin = getAdminClient();
  const now = new Date().toISOString();

  // Fetch any existing progress row so we update the correct column.
  const { data: existing } = await admin
    .from('employee_onboarding_progress')
    .select('id, employee_checked_at, manager_checked_at, manager_id')
    .eq('user_id', targetUserId)
    .eq('item_id', itemId)
    .maybeSingle();

  const next: {
    user_id: string;
    item_id: string;
    employee_checked_at: string | null;
    manager_checked_at: string | null;
    manager_id: string | null;
  } = {
    user_id: targetUserId,
    item_id: itemId,
    employee_checked_at: existing?.employee_checked_at ?? null,
    manager_checked_at: existing?.manager_checked_at ?? null,
    manager_id: existing?.manager_id ?? null,
  };

  if (column === 'employee') {
    next.employee_checked_at = checked ? now : null;
  } else {
    next.manager_checked_at = checked ? now : null;
    next.manager_id = checked ? user.id : null;
  }

  if (existing) {
    const { error } = await admin
      .from('employee_onboarding_progress')
      .update({
        employee_checked_at: next.employee_checked_at,
        manager_checked_at: next.manager_checked_at,
        manager_id: next.manager_id,
        updated_at: now,
      })
      .eq('id', existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await admin
      .from('employee_onboarding_progress')
      .insert({
        user_id: targetUserId,
        item_id: itemId,
        employee_checked_at: next.employee_checked_at,
        manager_checked_at: next.manager_checked_at,
        manager_id: next.manager_id,
      });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
