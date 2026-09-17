import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { MANAGER_ROLES } from '@/lib/training-path';

export const dynamic = 'force-dynamic';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/** positions.department → profiles.onboarding_category */
function categoryFor(department: string | null | undefined): 'foh' | 'boh' | 'mgmt' | null {
  const d = (department || '').toLowerCase();
  if (d === 'foh' || d.startsWith('front')) return 'foh';
  if (d === 'boh' || d.startsWith('back')) return 'boh';
  if (d === 'mgmt' || d.startsWith('manage')) return 'mgmt';
  return null;
}

async function ensureManagerScope() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const { data: me } = await supabase
    .from('profiles')
    .select('role, restaurant_id, status')
    .eq('id', user.id)
    .single();
  if (!me || me.status === 'archived' || !MANAGER_ROLES.includes(me.role)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  let allowed: Set<string> | 'all' = 'all';
  if (me.role !== 'admin') {
    const { data: extras } = await supabase
      .from('user_locations')
      .select('restaurant_id')
      .eq('profile_id', user.id);
    allowed = new Set<string>(
      [me.restaurant_id, ...(extras || []).map((e) => e.restaurant_id)].filter(Boolean) as string[]
    );
  }
  return { user, allowed };
}

const inScope = (allowed: Set<string> | 'all', restaurantId: string | null) =>
  allowed === 'all' || (!!restaurantId && allowed.has(restaurantId));

/**
 * POST   /api/training/assignments  { user_id, position_slug?, trainer_id?, start_date? }
 * DELETE /api/training/assignments  { user_id }
 *
 * Start (or update) guided training for a new hire: set their position
 * (which also sets FOH/BOH/management), assign their trainer, and record
 * the start date and which manager set it up. Manager+ only, for staff at
 * restaurants they manage. The trainer must work at the same restaurant.
 */
export async function POST(req: NextRequest) {
  const auth = await ensureManagerScope();
  if (auth.error) return auth.error;

  const body = await req.json();
  const userId: string | null = body.user_id || null;
  if (!userId) return NextResponse.json({ error: 'user_id is required' }, { status: 400 });

  const admin = getAdminClient();
  const { data: target } = await admin
    .from('profiles')
    .select('id, restaurant_id, status, hire_date')
    .eq('id', userId)
    .single();
  if (!target || target.status === 'archived') {
    return NextResponse.json({ error: 'That person isn’t an active employee.' }, { status: 404 });
  }
  if (!inScope(auth.allowed!, target.restaurant_id)) {
    return NextResponse.json({ error: 'Access denied for this restaurant' }, { status: 403 });
  }

  const startDate: string | undefined = typeof body.start_date === 'string' && body.start_date ? body.start_date : undefined;
  if (startDate && !DATE_RE.test(startDate)) {
    return NextResponse.json({ error: 'Start date must look like 2026-09-16.' }, { status: 400 });
  }

  let trainerId: string | null | undefined;
  if (body.trainer_id !== undefined) {
    trainerId = body.trainer_id || null;
    if (trainerId) {
      if (trainerId === userId) {
        return NextResponse.json({ error: 'Someone can’t be their own trainer.' }, { status: 400 });
      }
      const { data: trainer } = await admin
        .from('profiles')
        .select('id, restaurant_id, status')
        .eq('id', trainerId)
        .single();
      if (!trainer || trainer.status === 'archived') {
        return NextResponse.json({ error: 'That trainer isn’t an active employee.' }, { status: 400 });
      }
      if (auth.allowed !== 'all' && trainer.restaurant_id !== target.restaurant_id) {
        return NextResponse.json({ error: 'Pick a trainer from the same restaurant.' }, { status: 400 });
      }
    }
  }

  // Position → also sets FOH / BOH / management so the right tracks resolve.
  const profileUpdates: Record<string, unknown> = {};
  if (body.position_slug) {
    const { data: position } = await admin
      .from('positions')
      .select('slug, department, active')
      .eq('slug', body.position_slug)
      .single();
    if (!position || !position.active) {
      return NextResponse.json({ error: 'Unknown position.' }, { status: 400 });
    }
    profileUpdates.position_slug = position.slug;
    const category = categoryFor(position.department);
    if (category) profileUpdates.onboarding_category = category;
  }
  if (!target.hire_date) profileUpdates.hire_date = startDate || new Date().toISOString().slice(0, 10);

  const { data: existing, error: existingError } = await admin
    .from('trainee_assignments')
    .select('user_id, trainer_id, start_date')
    .eq('user_id', userId)
    .maybeSingle();
  if (existingError) {
    return NextResponse.json({ error: 'Training setup needs database update 081 first.' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { error: assignError } = await admin
    .from('trainee_assignments')
    .upsert(
      {
        user_id: userId,
        trainer_id: trainerId === undefined ? existing?.trainer_id ?? null : trainerId,
        start_date: startDate || existing?.start_date || new Date().toISOString().slice(0, 10),
        assigned_by: auth.user!.id,
        updated_at: now,
      },
      { onConflict: 'user_id' }
    );
  if (assignError) return NextResponse.json({ error: assignError.message }, { status: 400 });

  if (Object.keys(profileUpdates).length > 0) {
    const { error: profileError } = await admin.from('profiles').update(profileUpdates).eq('id', userId);
    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const auth = await ensureManagerScope();
  if (auth.error) return auth.error;

  const body = await req.json();
  const userId: string | null = body.user_id || null;
  if (!userId) return NextResponse.json({ error: 'user_id is required' }, { status: 400 });

  const admin = getAdminClient();
  const { data: target } = await admin.from('profiles').select('restaurant_id').eq('id', userId).single();
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (!inScope(auth.allowed!, target.restaurant_id)) {
    return NextResponse.json({ error: 'Access denied for this restaurant' }, { status: 403 });
  }

  const { error } = await admin.from('trainee_assignments').delete().eq('user_id', userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
