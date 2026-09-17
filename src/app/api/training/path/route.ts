import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { pingLastSeen } from '@/lib/last-seen';
import { MANAGER_ROLES, resolveTrainingPath, isAssignedTrainer } from '@/lib/training-path';

export const dynamic = 'force-dynamic';

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * GET /api/training/path[?user_id=<uuid>]
 *
 * Resolves the training ladder for the current user — or, for managers and
 * the person's assigned trainer, someone else: foundations + department
 * core + position track + certifications, each module with completion
 * status. Resolution lives in src/lib/training-path.ts.
 */
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  pingLastSeen(user.id);

  const { data: me } = await supabase
    .from('profiles')
    .select('id, role, status')
    .eq('id', user.id)
    .single();
  if (!me || me.status === 'archived') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const adminClient = getAdminClient();
  const requestedUserId = req.nextUrl.searchParams.get('user_id');
  if (
    requestedUserId && requestedUserId !== user.id &&
    !MANAGER_ROLES.includes(me.role) &&
    !(await isAssignedTrainer(adminClient, user.id, requestedUserId))
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const path = await resolveTrainingPath(adminClient, requestedUserId || user.id);
  if (!path) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json(path);
}

/**
 * POST /api/training/path — complete a module.
 * Body: { module_id, user_id? }
 *   • 'self' modules: anyone completes their OWN.
 *   • 'trainer' modules (shadow shifts): the assigned trainer or any manager.
 *   • 'manager' modules: manager+ signs off for the given user_id.
 *   • 'exam' modules: rejected — they complete by passing the quiz.
 * DELETE with same body undoes (own self-modules; trainer for trainer
 * modules; managers for anything).
 */
export async function POST(req: NextRequest) {
  return handleToggle(req, 'complete');
}
export async function DELETE(req: NextRequest) {
  return handleToggle(req, 'undo');
}

async function handleToggle(req: NextRequest, action: 'complete' | 'undo') {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: me } = await supabase
    .from('profiles')
    .select('id, role, status')
    .eq('id', user.id)
    .single();
  if (!me || me.status === 'archived') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const isManager = MANAGER_ROLES.includes(me.role);

  const body = await req.json();
  const moduleId: string | null = body.module_id || null;
  const targetId: string = body.user_id || user.id;
  if (!moduleId) return NextResponse.json({ error: 'module_id is required' }, { status: 400 });

  const adminClient = getAdminClient();
  const { data: module } = await adminClient
    .from('track_modules')
    .select('id, completion, module_type, title')
    .eq('id', moduleId)
    .single();
  if (!module) return NextResponse.json({ error: 'Module not found' }, { status: 404 });

  if (module.completion === 'exam') {
    return NextResponse.json({ error: 'This module completes by passing its exam.' }, { status: 400 });
  }
  if (module.completion === 'self' && targetId !== user.id) {
    return NextResponse.json({ error: 'Self modules can only be completed by the person themselves.' }, { status: 403 });
  }
  if (module.completion === 'manager' && !isManager) {
    return NextResponse.json({ error: 'This skill needs a manager sign-off.' }, { status: 403 });
  }
  const isTrainer =
    module.completion === 'trainer' && !isManager && targetId !== user.id
      ? await isAssignedTrainer(adminClient, user.id, targetId)
      : false;
  if (module.completion === 'trainer' && !isManager && !isTrainer) {
    return NextResponse.json({ error: 'Only their trainer or a manager can mark this.' }, { status: 403 });
  }

  if (action === 'undo') {
    const ownSelf = module.completion === 'self' && targetId === user.id;
    if (!isManager && !ownSelf && !isTrainer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { error } = await adminClient
      .from('module_progress')
      .delete()
      .eq('user_id', targetId)
      .eq('module_id', moduleId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }

  const { error } = await adminClient
    .from('module_progress')
    .upsert(
      {
        user_id: targetId,
        module_id: moduleId,
        completed_at: new Date().toISOString(),
        // Who signed it: the trainer or manager (null for the person's own check-offs).
        manager_id: module.completion === 'manager' || module.completion === 'trainer' ? user.id : null,
      },
      { onConflict: 'user_id,module_id' }
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
