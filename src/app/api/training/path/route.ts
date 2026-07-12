import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { pingLastSeen } from '@/lib/last-seen';

export const dynamic = 'force-dynamic';

const MANAGER_ROLES = ['admin', 'manager', 'assistant_manager'];
const PHOTO_TEST_PREFIX = '📸 Menu Photo Test';

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

interface TrackRow {
  id: string; restaurant_id: string | null;
  title: string; title_es: string | null;
  description: string | null; description_es: string | null;
  emoji: string | null; level: string; applies_to: string;
  position_slugs: string[]; sort_order: number;
}
interface ModuleRow {
  id: string; track_id: string; title: string; title_es: string | null;
  description: string | null; description_es: string | null;
  module_type: string; ref_id: string | null; completion: string;
  required: boolean; sort_order: number;
}

/**
 * GET /api/training/path[?user_id=<uuid>]
 *
 * Resolves the training ladder for the current user (or, for managers,
 * any user): foundations + their department core + their position track
 * (restaurant-specific track beats the global skeleton) + certifications
 * matching their department/position. Each module carries completion
 * status resolved from module_progress, quiz passes, or the live photo
 * test.
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

  const requestedUserId = req.nextUrl.searchParams.get('user_id');
  const isManager = MANAGER_ROLES.includes(me.role);
  if (requestedUserId && requestedUserId !== user.id && !isManager) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const targetId = requestedUserId || user.id;

  // Target profile drives track resolution. Admin client so managers can
  // resolve any staff member's path.
  const adminClient = getAdminClient();
  const { data: target } = await adminClient
    .from('profiles')
    .select('id, full_name, role, restaurant_id, onboarding_category, position_slug')
    .eq('id', targetId)
    .single();
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const category: string | null = target.onboarding_category || null;
  const slug: string | null = target.position_slug || null;

  const [{ data: allTracks }, { data: allModules }, { data: progress }] = await Promise.all([
    adminClient.from('training_tracks').select('*').eq('active', true).order('sort_order'),
    adminClient.from('track_modules').select('*').eq('active', true).order('sort_order'),
    adminClient.from('module_progress').select('module_id, completed_at, manager_id').eq('user_id', targetId),
  ]);

  const tracks = (allTracks ?? []) as TrackRow[];
  const modules = (allModules ?? []) as ModuleRow[];

  const audienceMatch = (t: TrackRow) =>
    t.applies_to === 'all' || (category !== null && t.applies_to === category);

  const mine: TrackRow[] = [];
  for (const t of tracks) {
    if (t.restaurant_id && target.restaurant_id && t.restaurant_id !== target.restaurant_id) continue;
    if (t.level === 'foundations') { mine.push(t); continue; }
    if (t.level === 'department') { if (audienceMatch(t)) mine.push(t); continue; }
    if (t.level === 'position') {
      if (slug && t.position_slugs.includes(slug)) mine.push(t);
      continue;
    }
    if (t.level === 'certification') {
      if (!audienceMatch(t)) continue;
      if (t.position_slugs.length > 0 && (!slug || !t.position_slugs.includes(slug))) continue;
      mine.push(t);
    }
  }

  // Restaurant-specific position track beats the global skeleton.
  const positionTracks = mine.filter((t) => t.level === 'position');
  const hasSpecific = positionTracks.some((t) => t.restaurant_id !== null);
  const resolved = mine.filter((t) =>
    t.level !== 'position' || !hasSpecific || t.restaurant_id !== null
  );

  // ── Completion resolution ──
  const progressByModule = new Map((progress ?? []).map((p) => [p.module_id, p]));

  const quizRefIds = modules
    .filter((m) => m.module_type === 'quiz' && m.ref_id)
    .map((m) => m.ref_id as string);
  const passedQuizIds = new Set<string>();
  if (quizRefIds.length > 0) {
    const { data: passes } = await adminClient
      .from('quiz_attempts')
      .select('quiz_id')
      .eq('user_id', targetId)
      .eq('passed', true)
      .in('quiz_id', quizRefIds);
    for (const p of passes ?? []) passedQuizIds.add(p.quiz_id);
  }

  // Photo test: passed ANY version of the restaurant's photo test.
  let photoTestPassed = false;
  let photoTestExists = false;
  if (target.restaurant_id) {
    const { data: photoQuizzes } = await adminClient
      .from('quizzes')
      .select('id, active')
      .eq('restaurant_id', target.restaurant_id)
      .like('title', `${PHOTO_TEST_PREFIX}%`);
    const ids = (photoQuizzes ?? []).map((q) => q.id);
    photoTestExists = (photoQuizzes ?? []).some((q) => q.active);
    if (ids.length > 0) {
      const { data: pass } = await adminClient
        .from('quiz_attempts')
        .select('id')
        .eq('user_id', targetId)
        .eq('passed', true)
        .in('quiz_id', ids)
        .limit(1);
      photoTestPassed = (pass ?? []).length > 0;
    }
  }

  const out = resolved.map((t) => {
    const mods = modules
      .filter((m) => m.track_id === t.id)
      .map((m) => {
        const prog = progressByModule.get(m.id);
        const done =
          m.module_type === 'quiz' ? passedQuizIds.has(m.ref_id || '') :
          m.module_type === 'photo_test' ? photoTestPassed :
          !!prog;
        return {
          id: m.id,
          title: m.title,
          title_es: m.title_es,
          description: m.description,
          description_es: m.description_es,
          module_type: m.module_type,
          ref_id: m.ref_id,
          completion: m.completion,
          required: m.required,
          sort_order: m.sort_order,
          done,
          completed_at: prog?.completed_at ?? null,
          signed_off: !!prog?.manager_id,
          // Photo test module with no live test yet — the UI can say so.
          available: m.module_type !== 'photo_test' || photoTestExists,
        };
      });
    const req_ = mods.filter((m) => m.required);
    const doneCount = req_.filter((m) => m.done).length;
    return {
      id: t.id,
      title: t.title,
      title_es: t.title_es,
      description: t.description,
      description_es: t.description_es,
      emoji: t.emoji,
      level: t.level,
      modules: mods,
      required_total: req_.length,
      required_done: doneCount,
      pct: req_.length === 0 ? 0 : Math.round((doneCount / req_.length) * 100),
    };
  });

  const levelOrder = ['foundations', 'department', 'position', 'certification'];
  out.sort((a, b) => levelOrder.indexOf(a.level) - levelOrder.indexOf(b.level) || a.title.localeCompare(b.title));

  return NextResponse.json({
    user: {
      id: target.id,
      full_name: target.full_name,
      onboarding_category: category,
      position_slug: slug,
    },
    tracks: out,
  });
}

/**
 * POST /api/training/path — complete a module.
 * Body: { module_id, user_id? }
 *   • 'self' modules: anyone completes their OWN.
 *   • 'manager' modules: manager+ signs off for the given user_id.
 *   • 'exam' modules: rejected — they complete by passing the quiz.
 * DELETE with same body undoes (own self-modules, or manager for sign-offs).
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

  if (action === 'undo') {
    // Own self-modules, or manager for anything.
    if (!isManager && targetId !== user.id) {
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
        manager_id: module.completion === 'manager' ? user.id : null,
      },
      { onConflict: 'user_id,module_id' }
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
