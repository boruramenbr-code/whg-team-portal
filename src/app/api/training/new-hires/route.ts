import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getOnboardingForUser } from '@/lib/onboarding';
import { MANAGER_ROLES, resolveTrainingPath } from '@/lib/training-path';
import {
  buildGuideStages, guideSummary, isInTraining, STAGE_META, STUCK_AFTER_DAYS,
} from '@/lib/guided-training';

export const dynamic = 'force-dynamic';

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const DAY_MS = 86_400_000;

/**
 * GET /api/training/new-hires[?restaurant_id=<uuid>]
 *
 * Mission Control → Training → New Hires. Everyone currently in guided
 * training at the restaurants this manager runs: their stage, trainer,
 * start date, and a "stuck" flag when nothing has moved in a few days.
 * Also returns the staff and position lists the "Start training" form needs.
 * Admins can narrow to one restaurant with ?restaurant_id.
 */
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: me } = await supabase
    .from('profiles')
    .select('role, restaurant_id, status')
    .eq('id', user.id)
    .single();
  if (!me || me.status === 'archived' || !MANAGER_ROLES.includes(me.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let restaurantIds: string[] | null = null;
  if (me.role !== 'admin') {
    const { data: extras } = await supabase
      .from('user_locations')
      .select('restaurant_id')
      .eq('profile_id', user.id);
    restaurantIds = [me.restaurant_id, ...(extras || []).map((e) => e.restaurant_id)].filter(Boolean) as string[];
  }
  const requested = req.nextUrl.searchParams.get('restaurant_id');
  if (requested && (me.role === 'admin' || restaurantIds?.includes(requested))) restaurantIds = [requested];

  const admin = getAdminClient();
  let staffQuery = admin
    .from('profiles')
    .select('id, full_name, role, restaurant_id, position_slug, hire_date, restaurants(name)')
    .eq('status', 'active')
    .order('full_name');
  if (restaurantIds) staffQuery = staffQuery.in('restaurant_id', restaurantIds);

  const [{ data: staff }, assignmentsRes, { data: overrides }, { data: positions }] = await Promise.all([
    staffQuery,
    admin.from('trainee_assignments').select('user_id, trainer_id, start_date'),
    admin.from('floor_ready_overrides').select('user_id'),
    admin.from('positions').select('slug, name, emoji, department, sort_order').eq('active', true).order('sort_order'),
  ]);

  const assignments = assignmentsRes.error ? [] : assignmentsRes.data ?? [];
  const assignmentByUser = new Map(assignments.map((a) => [a.user_id, a]));
  const signedOff = new Set((overrides ?? []).map((o) => o.user_id));
  const nameById = new Map((staff ?? []).map((s) => [s.id, s.full_name]));
  const positionName = new Map((positions ?? []).map((p) => [p.slug, p.name]));

  const candidates = (staff ?? []).filter((s) =>
    isInTraining({
      hireDate: s.hire_date,
      hasAssignment: assignmentByUser.has(s.id),
      floorReady: signedOff.has(s.id),
    })
  );

  // Last time anything moved, per candidate.
  const ids = candidates.map((c) => c.id);
  const lastActivity = new Map<string, number>();
  if (ids.length > 0) {
    const [{ data: moduleRows }, { data: checklistRows }] = await Promise.all([
      admin.from('module_progress').select('user_id, completed_at').in('user_id', ids),
      admin.from('employee_onboarding_progress').select('user_id, updated_at').in('user_id', ids),
    ]);
    const bump = (id: string, iso: string | null) => {
      if (!iso) return;
      const t = new Date(iso).getTime();
      if (t > (lastActivity.get(id) ?? 0)) lastActivity.set(id, t);
    };
    for (const r of moduleRows ?? []) bump(r.user_id, r.completed_at);
    for (const r of checklistRows ?? []) bump(r.user_id, r.updated_at);
  }

  const now = Date.now();
  const hires = await Promise.all(candidates.map(async (c) => {
    const [path, onboarding] = await Promise.all([
      resolveTrainingPath(admin, c.id),
      getOnboardingForUser(admin, c.id),
    ]);
    const stages = buildGuideStages({
      tracks: path?.tracks ?? [],
      checklist: onboarding?.items ?? [],
      floorReady: path?.floor_ready ?? { ready: false, ready_for_signoff: false },
    });
    const summary = guideSummary(stages);
    const assignment = assignmentByUser.get(c.id) ?? null;
    const startDate = assignment?.start_date ?? c.hire_date ?? null;
    const startMs = startDate ? new Date(`${startDate}T12:00:00`).getTime() : now;
    const since = Math.max(startMs, lastActivity.get(c.id) ?? 0);
    const quietDays = Math.max(0, Math.floor((now - since) / DAY_MS));
    return {
      id: c.id,
      full_name: c.full_name,
      role: c.role,
      restaurant_id: c.restaurant_id,
      restaurant_name: (c.restaurants as unknown as { name: string } | null)?.name ?? null,
      position_slug: c.position_slug,
      position_name: c.position_slug ? positionName.get(c.position_slug) ?? c.position_slug : null,
      start_date: startDate,
      assigned: !!assignment,
      trainer_id: assignment?.trainer_id ?? null,
      trainer_name: assignment?.trainer_id ? nameById.get(assignment.trainer_id) ?? null : null,
      summary,
      current_title: summary.current ? STAGE_META[summary.current].en : 'Done',
      ready_for_signoff: path?.floor_ready.ready_for_signoff ?? false,
      quiet_days: quietDays,
      stuck: !summary.complete && !path?.floor_ready.ready_for_signoff && quietDays >= STUCK_AFTER_DAYS,
    };
  }));

  // Needs attention first: ready for sign-off, then stuck, then newest.
  hires.sort((a, b) =>
    Number(b.ready_for_signoff) - Number(a.ready_for_signoff) ||
    Number(b.stuck) - Number(a.stuck) ||
    (b.start_date ?? '').localeCompare(a.start_date ?? '')
  );

  return NextResponse.json(
    {
      hires,
      staff: (staff ?? []).map((s) => ({
        id: s.id,
        full_name: s.full_name,
        role: s.role,
        restaurant_id: s.restaurant_id,
        restaurant_name: (s.restaurants as unknown as { name: string } | null)?.name ?? null,
        position_slug: s.position_slug,
      })),
      positions: positions ?? [],
      needs_migration: !!assignmentsRes.error,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
