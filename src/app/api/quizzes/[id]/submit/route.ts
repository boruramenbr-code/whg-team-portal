import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * POST /api/quizzes/[id]/submit
 *
 * Body: { answers: [{ question_id, selected_choice_id }] }
 *   selected_choice_id can be null if the user skipped — counted as wrong.
 *
 * Server-side grading. Client never learns which choice was correct until
 * the response comes back. Score = correct / total * 100. Passed =
 * score >= quiz.pass_threshold at submit time.
 *
 * Returns: { attempt: { id, score, passed, submitted_at },
 *           details: [{ question_id, selected_choice_id, is_correct, correct_choice_id }] }
 *   `details` powers the "see what you got right/wrong" review screen.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const rawAnswers = Array.isArray(body?.answers) ? body.answers : null;
  if (!rawAnswers) return NextResponse.json({ error: 'answers[] is required' }, { status: 400 });

  const adminClient = getAdminClient();

  // Load quiz + questions + choices via service role so we have the answer key.
  // (Reader can't rely on RLS-scoped GET because the take-mode client hides is_correct.)
  const { data: quiz } = await adminClient
    .from('quizzes')
    .select('id, pass_threshold, active, restaurant_id')
    .eq('id', params.id)
    .maybeSingle();
  if (!quiz || !quiz.active) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });

  // Re-verify user visibility via a request-bound read so we don't allow
  // a staff member from Restaurant A to submit an attempt for Restaurant B's quiz.
  const { data: visible } = await supabase
    .from('quizzes').select('id').eq('id', params.id).maybeSingle();
  if (!visible) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data: questions } = await adminClient
    .from('quiz_questions')
    .select('id, quiz_id, active, sort_order, choices:quiz_choices(id, is_correct)')
    .eq('quiz_id', quiz.id)
    .eq('active', true);

  type Q = { id: string; active: boolean; choices: { id: string; is_correct: boolean }[] | null };
  const qs = (questions ?? []) as Q[];
  if (qs.length === 0) {
    return NextResponse.json({ error: 'This quiz has no questions yet.' }, { status: 400 });
  }

  // Build the answer key: question_id -> correct choice id (first correct wins).
  const correctByQuestion = new Map<string, string | null>();
  for (const q of qs) {
    const correct = (q.choices ?? []).find((c) => c.is_correct);
    correctByQuestion.set(q.id, correct?.id ?? null);
  }

  // Build a fast lookup of submitted answers.
  type SubmittedAnswer = { question_id: string; selected_choice_id: string | null };
  const submitted = new Map<string, string | null>();
  for (const a of rawAnswers as SubmittedAnswer[]) {
    if (a && typeof a.question_id === 'string') {
      submitted.set(a.question_id, a.selected_choice_id ?? null);
    }
  }

  // Grade.
  let correctCount = 0;
  const detailRows: {
    question_id: string;
    selected_choice_id: string | null;
    is_correct: boolean;
    correct_choice_id: string | null;
  }[] = [];
  for (const q of qs) {
    const selected = submitted.get(q.id) ?? null;
    const answerKey = correctByQuestion.get(q.id) ?? null;
    const is_correct = !!selected && !!answerKey && selected === answerKey;
    if (is_correct) correctCount++;
    detailRows.push({
      question_id: q.id,
      selected_choice_id: selected,
      is_correct,
      correct_choice_id: answerKey,
    });
  }

  const score = Math.round((correctCount / qs.length) * 100);
  const passed = score >= quiz.pass_threshold;
  const now = new Date().toISOString();

  // Insert the attempt.
  const { data: attempt, error: attemptError } = await adminClient
    .from('quiz_attempts')
    .insert({
      user_id: user.id,
      quiz_id: quiz.id,
      score,
      passed,
      started_at: now,
      submitted_at: now,
    })
    .select('id, score, passed, submitted_at')
    .single();

  if (attemptError || !attempt) {
    return NextResponse.json({ error: attemptError?.message || 'Failed to save attempt' }, { status: 500 });
  }

  // Insert per-question answers.
  const answersToInsert = detailRows.map((d) => ({
    attempt_id: attempt.id,
    question_id: d.question_id,
    selected_choice_id: d.selected_choice_id,
    is_correct: d.is_correct,
  }));
  if (answersToInsert.length > 0) {
    const { error: answersError } = await adminClient.from('quiz_answers').insert(answersToInsert);
    if (answersError) {
      // Best-effort — the attempt row still records the score.
      console.error('quiz_answers insert failed:', answersError.message);
    }
  }

  return NextResponse.json({ attempt, details: detailRows });
}
