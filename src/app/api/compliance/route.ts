import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { filterPoliciesForUser, decoratePoliciesWithStatus } from '@/lib/policies';
import type { Policy, UserRole } from '@/lib/types';

export const dynamic = 'force-dynamic';

// Employees whose newest policy has been active for more than this many days
// without a signature are flagged "overdue".
const OVERDUE_AFTER_DAYS = 14;

type Status = 'all_signed' | 'behind' | 'overdue' | 'not_required';

interface MissingPolicy {
  policy_id: string;
  title: string;
  effective_date: string;
  days_outstanding: number;
  needs_resign: boolean; // signed an older version
}

interface EmployeeCompliance {
  user_id: string;
  full_name: string;
  role: UserRole;
  restaurant_id: string;
  restaurant_name: string | null;
  total_required: number;
  signed_count: number;
  missing_count: number;
  oldest_unsigned_days: number | null;
  status: Status;
  missing: MissingPolicy[];
}

/**
 * GET /api/compliance
 * Returns per-employee policy signature status.
 * - Admins see every active employee across all restaurants.
 * - Managers / assistant managers see only their restaurant_id.
 * - Everyone else gets 403.
 */
export async function GET() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: viewerProfile } = await supabase
    .from('profiles')
    .select('id, role, restaurant_id, status')
    .eq('id', user.id)
    .single();

  if (!viewerProfile || viewerProfile.status === 'archived') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const viewerIsAdmin = viewerProfile.role === 'admin';
  const viewerIsManager = viewerProfile.role === 'manager' || viewerProfile.role === 'assistant_manager';
  if (!viewerIsAdmin && !viewerIsManager) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // ── Load all active policies once ───────────────────────────────────
  const { data: policies, error: policiesError } = await supabase
    .from('policies')
    .select('*')
    .eq('active', true);
  if (policiesError) {
    return NextResponse.json({ error: policiesError.message }, { status: 500 });
  }
  const allPolicies = (policies ?? []) as Policy[];

  // ── Load the employees the viewer is allowed to see ────────────────
  let employeesQuery = supabase
    .from('profiles')
    .select('id, full_name, role, restaurant_id, status, restaurants(name)')
    .eq('status', 'active');

  if (!viewerIsAdmin) {
    employeesQuery = employeesQuery.eq('restaurant_id', viewerProfile.restaurant_id);
  }

  const { data: employees, error: employeesError } = await employeesQuery;
  if (employeesError) {
    return NextResponse.json({ error: employeesError.message }, { status: 500 });
  }

  const employeeRows = (employees ?? []) as Array<{
    id: string;
    full_name: string;
    role: UserRole;
    restaurant_id: string;
    restaurants: { name?: string } | { name?: string }[] | null;
  }>;

  if (employeeRows.length === 0) {
    return NextResponse.json({ employees: [], summary: emptySummary() });
  }

  // ── Load every signature for those employees in one query ──────────
  const employeeIds = employeeRows.map((e) => e.id);
  const { data: signatures, error: sigsError } = await supabase
    .from('policy_signatures')
    .select('user_id, policy_id, policy_version, signed_at')
    .in('user_id', employeeIds);
  if (sigsError) {
    return NextResponse.json({ error: sigsError.message }, { status: 500 });
  }

  const sigsByUser = new Map<string, Array<{ policy_id: string; policy_version: number; signed_at: string }>>();
  for (const s of signatures ?? []) {
    const arr = sigsByUser.get(s.user_id) ?? [];
    arr.push({ policy_id: s.policy_id, policy_version: s.policy_version, signed_at: s.signed_at });
    sigsByUser.set(s.user_id, arr);
  }

  const now = Date.now();
  const msPerDay = 1000 * 60 * 60 * 24;

  // ── Compute per-employee compliance ────────────────────────────────
  const compiled: EmployeeCompliance[] = employeeRows.map((emp) => {
    // restaurants can come back as either object or array depending on the driver
    const restaurantName = Array.isArray(emp.restaurants)
      ? emp.restaurants[0]?.name ?? null
      : emp.restaurants?.name ?? null;

    const requiredPolicies = filterPoliciesForUser(allPolicies, {
      role: emp.role,
      restaurant_id: emp.restaurant_id,
    }).filter((p) => p.kind === 'policy');

    if (requiredPolicies.length === 0) {
      return {
        user_id: emp.id,
        full_name: emp.full_name,
        role: emp.role,
        restaurant_id: emp.restaurant_id,
        restaurant_name: restaurantName,
        total_required: 0,
        signed_count: 0,
        missing_count: 0,
        oldest_unsigned_days: null,
        status: 'not_required' as Status,
        missing: [],
      };
    }

    const decorated = decoratePoliciesWithStatus(
      requiredPolicies,
      sigsByUser.get(emp.id) ?? [],
    );

    const missing: MissingPolicy[] = decorated
      .filter((p) => !p.signed)
      .map((p) => {
        const effective = new Date(p.effective_date).getTime();
        const days = Math.max(0, Math.floor((now - effective) / msPerDay));
        return {
          policy_id: p.id,
          title: p.title,
          effective_date: p.effective_date,
          days_outstanding: days,
          needs_resign: p.needs_resign,
        };
      })
      .sort((a, b) => b.days_outstanding - a.days_outstanding);

    const oldestUnsignedDays = missing.length > 0 ? missing[0].days_outstanding : null;
    const signedCount = decorated.filter((p) => p.signed).length;

    let status: Status;
    if (missing.length === 0) {
      status = 'all_signed';
    } else if ((oldestUnsignedDays ?? 0) > OVERDUE_AFTER_DAYS) {
      status = 'overdue';
    } else {
      status = 'behind';
    }

    return {
      user_id: emp.id,
      full_name: emp.full_name,
      role: emp.role,
      restaurant_id: emp.restaurant_id,
      restaurant_name: restaurantName,
      total_required: requiredPolicies.length,
      signed_count: signedCount,
      missing_count: missing.length,
      oldest_unsigned_days: oldestUnsignedDays,
      status,
      missing,
    };
  });

  // Sort: overdue first, then behind, then all_signed / not_required.
  // Inside each bucket, sort by oldest unsigned days desc, then name asc.
  const statusRank: Record<Status, number> = { overdue: 0, behind: 1, all_signed: 2, not_required: 3 };
  compiled.sort((a, b) => {
    const r = statusRank[a.status] - statusRank[b.status];
    if (r !== 0) return r;
    const aDays = a.oldest_unsigned_days ?? -1;
    const bDays = b.oldest_unsigned_days ?? -1;
    if (bDays !== aDays) return bDays - aDays;
    return a.full_name.localeCompare(b.full_name);
  });

  const summary = {
    total_employees: compiled.length,
    all_signed: compiled.filter((e) => e.status === 'all_signed').length,
    behind: compiled.filter((e) => e.status === 'behind').length,
    overdue: compiled.filter((e) => e.status === 'overdue').length,
    not_required: compiled.filter((e) => e.status === 'not_required').length,
    overdue_after_days: OVERDUE_AFTER_DAYS,
  };

  return NextResponse.json({
    employees: compiled,
    summary,
    viewer: {
      is_admin: viewerIsAdmin,
      restaurant_id: viewerProfile.restaurant_id,
    },
  });
}

function emptySummary() {
  return {
    total_employees: 0,
    all_signed: 0,
    behind: 0,
    overdue: 0,
    not_required: 0,
    overdue_after_days: OVERDUE_AFTER_DAYS,
  };
}
