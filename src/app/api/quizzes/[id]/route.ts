import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const MANAGER_ROLES = ['admin', 'manager', 'assistant_manager'];

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * GET /api/quizzes/[id]?mode=take|edit
 *
 * mode=take (default): staff-facing. Returns questions with choices — but
 *   choices DO NOT include is_correct so the answer key isn't exposed to
 *   the player. Correctness is decided server-side on submit.
 * mode=edit: manager+. Full detail including is_correct so the author can
 *   verify the key while editing.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const mode = req.nextUrl.searchParams.get('mode') === 'edit' ? 'edit' : 'take';

  if (mode === 'edit') {
    const { data: profile } = await supabase
      .from('profiles').select('role, status').eq('id', user.id).single();
    if (!profile || profile.status === 'archived' || !MANAGER_ROLES.includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // RLS scopes visibility for the take path. The edit path is manager-
  // gated above; we still use the request-bound client so RLS is on.
  const { data: quiz, error } = await supabase
    .from('quizzes')
    .select('id, title, title_es, description, description_es, kind, restaurant_id, pass_threshold, applies_to, video_id, menu_category_id, active')
    .eq('id', params.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });

  const { data: rawQuestions } = await supabase
    .from('quiz_questions')
    .select(`
      id, quiz_id, question_text, question_text_es, question_type, sort_order,
      choices:quiz_choices(id, choice_text, choice_text_es, is_correct, sort_order)
    `)
    .eq('quiz_id', quiz.id)
    .eq('active', true)
    .order('sort_order', { ascending: true });

  type RawChoice = { id: string; choice_text: string; choice_text_es: string | null; is_correct: boolean; sort_order: number };
  type RawQuestion = {
    id: string; quiz_id: string; question_text: string; question_text_es: string | null;
    question_type: 'multiple_choice' | 'true_false'; sort_order: number;
    choices: RawChoice[] | null;
  };

  const questions = ((rawQuestions ?? []) as RawQuestion[]).map((q) => ({
    id: q.id,
    question_text: q.question_text,
    question_text_es: q.question_text_es,
    question_type: q.question_type,
    sort_order: q.sort_order,
    choices: (q.choices ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((c) => (mode === 'edit'
        ? { id: c.id, choice_text: c.choice_text, choice_text_es: c.choice_text_es, is_correct: c.is_correct, sort_order: c.sort_order }
        : { id: c.id, choice_text: c.choice_text, choice_text_es: c.choice_text_es, sort_order: c.sort_order }
      )),
  }));

  return NextResponse.json({ quiz: { ...quiz, questions } });
}

/**
 * PATCH /api/quizzes/[id]
 * Update quiz metadata. Manager+ only.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles').select('role, status').eq('id', user.id).single();
  if (!profile || profile.status === 'archived' || !MANAGER_ROLES.includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.title !== undefined)          updates.title = body.title?.trim() || null;
  if (body.title_es !== undefined)       updates.title_es = body.title_es?.trim() || null;
  if (body.description !== undefined)    updates.description = body.description?.trim() || null;
  if (body.description_es !== undefined) updates.description_es = body.description_es?.trim() || null;
  if (body.kind !== undefined) {
    if (!['exam', 'quiz'].includes(body.kind)) return NextResponse.json({ error: 'kind must be exam or quiz' }, { status: 400 });
    updates.kind = body.kind;
  }
  if (body.restaurant_id !== undefined)  updates.restaurant_id = body.restaurant_id || null;
  if (body.pass_threshold !== undefined) updates.pass_threshold = Math.min(100, Math.max(0, Number(body.pass_threshold) || 0));
  if (body.applies_to !== undefined) {
    if (!['all', 'foh', 'boh', 'mgmt'].includes(body.applies_to)) return NextResponse.json({ error: 'applies_to invalid' }, { status: 400 });
    updates.applies_to = body.applies_to;
  }
  if (body.video_id !== undefined)         updates.video_id = body.video_id || null;
  if (body.menu_category_id !== undefined) updates.menu_category_id = body.menu_category_id || null;
  if (body.active !== undefined)           updates.active = !!body.active;

  const adminClient = getAdminClient();
  const { error } = await adminClient
    .from('quizzes')
    .update(updates)
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

/**
 * DELETE /api/quizzes/[id]
 * Hard delete. Manager+ only. Cascades to questions/choices/attempts/answers.
 */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles').select('role, status').eq('id', user.id).single();
  if (!profile || profile.status === 'archived' || !MANAGER_ROLES.includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const adminClient = getAdminClient();
  const { error } = await adminClient.from('quizzes').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
