import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { pingLastSeen } from '@/lib/last-seen';

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
 * GET /api/quizzes
 *
 * Staff view: list of quizzes visible to this user with per-user summary
 *   (best score, last attempt date, has-passed flag).
 * Manager view: additionally includes attempt counts across all staff
 *   for the "authored quizzes" management surface.
 *
 * Response:
 *   { quizzes: [{ id, title, title_es, description, description_es,
 *       kind, pass_threshold, applies_to, video_id, menu_category_id,
 *       question_count, my_best_score, my_last_attempt_at, my_passed }] }
 */
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  pingLastSeen(user.id);

  // RLS filters quizzes to those the user can see.
  const { data: quizzes, error } = await supabase
    .from('quizzes')
    .select('id, title, title_es, description, description_es, kind, pass_threshold, applies_to, video_id, menu_category_id, restaurant_id')
    .eq('active', true)
    .order('kind', { ascending: true })         // exams first
    .order('title', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const quizIds = (quizzes ?? []).map((q) => q.id);
  if (quizIds.length === 0) {
    return NextResponse.json({ quizzes: [] });
  }

  // Question counts per quiz (single query, group in memory).
  const { data: questionRows } = await supabase
    .from('quiz_questions')
    .select('quiz_id')
    .in('quiz_id', quizIds)
    .eq('active', true);

  const questionCounts = new Map<string, number>();
  for (const q of questionRows ?? []) {
    questionCounts.set(q.quiz_id, (questionCounts.get(q.quiz_id) ?? 0) + 1);
  }

  // Own attempts across visible quizzes. Best score wins; last submitted_at
  // is the latest attempt. RLS already scopes attempts to own rows for staff.
  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select('quiz_id, score, passed, submitted_at')
    .in('quiz_id', quizIds)
    .eq('user_id', user.id)
    .not('submitted_at', 'is', null);

  type PerQuizSummary = { best: number; last: string; passed: boolean };
  const byQuiz = new Map<string, PerQuizSummary>();
  for (const a of attempts ?? []) {
    const cur = byQuiz.get(a.quiz_id);
    const best = Math.max(cur?.best ?? -1, a.score ?? 0);
    const last =
      !cur || (a.submitted_at ?? '') > cur.last ? (a.submitted_at ?? '') : cur.last;
    const passed = (cur?.passed ?? false) || !!a.passed;
    byQuiz.set(a.quiz_id, { best, last, passed });
  }

  const decorated = (quizzes ?? []).map((q) => {
    const s = byQuiz.get(q.id);
    return {
      ...q,
      question_count: questionCounts.get(q.id) ?? 0,
      my_best_score: s?.best ?? null,
      my_last_attempt_at: s?.last || null,
      my_passed: s?.passed ?? false,
    };
  });

  return NextResponse.json({ quizzes: decorated });
}

/**
 * POST /api/quizzes
 * Create a quiz. Manager+ only. Body:
 *   { title, title_es?, description?, description_es?, kind, restaurant_id?,
 *     pass_threshold?, applies_to?, video_id?, menu_category_id? }
 */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single();
  if (!profile || profile.status === 'archived' || !MANAGER_ROLES.includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { title, title_es, description, description_es, kind, restaurant_id, pass_threshold, applies_to, video_id, menu_category_id } = body;

  if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  if (kind && !['exam', 'quiz'].includes(kind)) {
    return NextResponse.json({ error: 'kind must be exam or quiz' }, { status: 400 });
  }
  const threshold = Number.isFinite(pass_threshold) ? Math.min(100, Math.max(0, Number(pass_threshold))) : 80;

  const adminClient = getAdminClient();
  const { data, error } = await adminClient
    .from('quizzes')
    .insert({
      title: title.trim(),
      title_es: title_es?.trim() || null,
      description: description?.trim() || null,
      description_es: description_es?.trim() || null,
      kind: kind || 'quiz',
      restaurant_id: restaurant_id || null,
      pass_threshold: threshold,
      applies_to: applies_to || 'all',
      video_id: video_id || null,
      menu_category_id: menu_category_id || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ quiz: data });
}
