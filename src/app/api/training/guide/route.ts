import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient, type SupabaseClient } from '@supabase/supabase-js';
import { pingLastSeen } from '@/lib/last-seen';
import { getOnboardingForUser } from '@/lib/onboarding';
import { MANAGER_ROLES, resolveTrainingPath, isAssignedTrainer } from '@/lib/training-path';
import { buildGuideStages, guideSummary, isInTraining } from '@/lib/guided-training';

export const dynamic = 'force-dynamic';

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function loadAssignment(admin: SupabaseClient, userId: string) {
  // Before migration 081 the table doesn't exist — treat as unassigned.
  const { data, error } = await admin
    .from('trainee_assignments')
    .select('trainer_id, start_date')
    .eq('user_id', userId)
    .maybeSingle();
  return error ? null : data;
}

/**
 * GET /api/training/guide[?user_id=<uuid>]
 *
 * The guided new-hire view: someone's training ladder plus, while they're
 * in training, the six ordered stages (Welcome → Paperwork → Meet your team
 * → Learn the job + Floor training → Floor-ready), their trainer, and the
 * faces for "Meet your team". Veterans get just the ladder (no extra
 * queries) so Home stays fast. Managers and the assigned trainer may view
 * someone else; a manager viewing always gets the stages.
 */
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = getAdminClient();
  const requested = req.nextUrl.searchParams.get('user_id');
  const targetId = requested || user.id;
  const self = targetId === user.id;

  // Your own ladder (Home, every open) loads alongside the profile check;
  // someone else's only after the permission check passes.
  const mePromise = supabase.from('profiles').select('id, role, status').eq('id', user.id).single();
  const loadPath = () => Promise.all([resolveTrainingPath(admin, targetId), loadAssignment(admin, targetId)]);
  const selfPath = self ? loadPath() : null;

  const { data: me } = await mePromise;
  if (!me || me.status === 'archived') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (!self) {
    if (!MANAGER_ROLES.includes(me.role) && !(await isAssignedTrainer(admin, user.id, targetId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  } else {
    pingLastSeen(user.id);
  }

  const [path, assignment] = await (selfPath ?? loadPath());
  if (!path) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const inTraining = isInTraining({
    hireDate: path.user.hire_date,
    hasAssignment: !!assignment,
    floorReady: path.floor_ready.ready,
  });
  const base = {
    user: path.user,
    tracks: path.tracks,
    floor_ready: path.floor_ready,
    in_training: inTraining,
  };
  if (!inTraining && !requested) {
    return NextResponse.json(base, { headers: { 'Cache-Control': 'private, no-store' } });
  }

  const rid = path.user.restaurant_id;
  const slug = path.user.position_slug;
  const [onboarding, trainerRes, restaurantRes, positionRes, teamRes] = await Promise.all([
    getOnboardingForUser(admin, targetId),
    assignment?.trainer_id
      ? admin.from('profiles').select('full_name').eq('id', assignment.trainer_id).maybeSingle()
      : Promise.resolve({ data: null }),
    rid
      ? admin.from('restaurants').select('name').eq('id', rid).maybeSingle()
      : Promise.resolve({ data: null }),
    slug
      ? admin.from('positions').select('name, emoji').eq('slug', slug).maybeSingle()
      : Promise.resolve({ data: null }),
    rid
      ? admin
          .from('org_chart_positions')
          .select('id, first_name, last_initial, title, role_level, photo_url, sort_order')
          .eq('restaurant_id', rid)
          .eq('active', true)
          .order('role_level', { ascending: true })
          .order('sort_order', { ascending: true })
      : Promise.resolve({ data: [] }),
  ]);

  const stages = buildGuideStages({
    tracks: path.tracks,
    checklist: onboarding?.items ?? [],
    floorReady: path.floor_ready,
  });

  return NextResponse.json(
    {
      ...base,
      stages,
      summary: guideSummary(stages),
      restaurant_name: (restaurantRes.data as { name?: string } | null)?.name ?? null,
      position: slug
        ? {
            slug,
            name: (positionRes.data as { name?: string } | null)?.name ?? slug.replace(/_/g, ' '),
            emoji: (positionRes.data as { emoji?: string | null } | null)?.emoji ?? null,
          }
        : null,
      assignment: assignment
        ? {
            trainer_id: assignment.trainer_id,
            trainer_name: (trainerRes.data as { full_name?: string } | null)?.full_name ?? null,
            start_date: assignment.start_date,
          }
        : null,
      team: teamRes.data ?? [],
    },
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
}
