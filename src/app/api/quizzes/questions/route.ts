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

async function requireManager() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const { data: profile } = await supabase
    .from('profiles').select('role, status').eq('id', user.id).single();
  if (!profile || profile.status === 'archived' || !MANAGER_ROLES.includes(profile.role)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { user };
}

/**
 * POST /api/quizzes/questions
 * Create a question with its choices in one call.
 * Body: {
 *   quiz_id, question_text, question_text_es?, question_type,
 *   sort_order?, choices: [{ choice_text, choice_text_es?, is_correct, sort_order? }]
 * }
 *
 * question_type='true_false' auto-generates the two choices True/False
 * (bilingual Verdadero/Falso) — the body's `choices` array is used only
 * to determine which of the two is correct via is_correct flag. For MC,
 * the choices array is inserted verbatim.
 *
 * Author must mark exactly one choice as correct.
 */
export async function POST(req: NextRequest) {
  const auth = await requireManager();
  if (auth.error) return auth.error;

  const body = await req.json();
  const {
    quiz_id, question_text, question_text_es, question_type, sort_order,
  } = body;
  const choices: {
    choice_text?: string; choice_text_es?: string;
    is_correct?: boolean; sort_order?: number;
  }[] = Array.isArray(body.choices) ? body.choices : [];

  if (!quiz_id) return NextResponse.json({ error: 'quiz_id is required' }, { status: 400 });
  if (!question_text?.trim()) return NextResponse.json({ error: 'Question text is required' }, { status: 400 });

  const qType: 'multiple_choice' | 'true_false' =
    question_type === 'true_false' ? 'true_false' : 'multiple_choice';

  // Validate the correct-choice flag.
  const correctCount = choices.filter((c) => c.is_correct).length;
  if (qType === 'multiple_choice') {
    if (choices.length < 2) return NextResponse.json({ error: 'Multiple choice needs at least 2 choices' }, { status: 400 });
    if (correctCount !== 1)  return NextResponse.json({ error: 'Mark exactly one choice as correct' }, { status: 400 });
    if (choices.some((c) => !c.choice_text?.trim())) return NextResponse.json({ error: 'Every choice needs text' }, { status: 400 });
  } else {
    if (correctCount !== 1) return NextResponse.json({ error: 'Mark True or False as the correct answer' }, { status: 400 });
  }

  const adminClient = getAdminClient();
  const { data: question, error: qError } = await adminClient
    .from('quiz_questions')
    .insert({
      quiz_id,
      question_text: question_text.trim(),
      question_text_es: question_text_es?.trim() || null,
      question_type: qType,
      sort_order: typeof sort_order === 'number' ? sort_order : 100,
    })
    .select('id')
    .single();

  if (qError || !question) {
    return NextResponse.json({ error: qError?.message || 'Failed to create question' }, { status: 400 });
  }

  // Build choice inserts.
  let choiceRows: {
    question_id: string; choice_text: string; choice_text_es: string | null;
    is_correct: boolean; sort_order: number;
  }[];

  if (qType === 'true_false') {
    // Two fixed choices. is_correct comes from whichever choice_text
    // matches 'true' (case-insensitive) in the body's flag.
    const trueIsCorrect = choices.some((c) =>
      c.is_correct && (c.choice_text?.toLowerCase() === 'true' || c.choice_text?.toLowerCase() === 'verdadero')
    );
    // If author just sent { is_correct: true } on the first choice and
    // named it something else, fall back to first-is-correct semantics
    // so we don't reject a valid submit.
    const flag = trueIsCorrect || (choices.length === 2 && !!choices[0]?.is_correct);
    choiceRows = [
      { question_id: question.id, choice_text: 'True', choice_text_es: 'Verdadero', is_correct: flag,   sort_order: 100 },
      { question_id: question.id, choice_text: 'False', choice_text_es: 'Falso',    is_correct: !flag,  sort_order: 200 },
    ];
  } else {
    choiceRows = choices.map((c, idx) => ({
      question_id: question.id,
      choice_text: (c.choice_text ?? '').trim(),
      choice_text_es: c.choice_text_es?.trim() || null,
      is_correct: !!c.is_correct,
      sort_order: typeof c.sort_order === 'number' ? c.sort_order : (idx + 1) * 100,
    }));
  }

  const { error: cError } = await adminClient.from('quiz_choices').insert(choiceRows);
  if (cError) {
    // Roll back the question so we don't leave an orphan.
    await adminClient.from('quiz_questions').delete().eq('id', question.id);
    return NextResponse.json({ error: cError.message }, { status: 400 });
  }

  return NextResponse.json({ question_id: question.id });
}

/**
 * PATCH /api/quizzes/questions?id=<uuid>
 * Update a question + replace its choices. Same body shape as POST but
 * without quiz_id. Simpler than incremental choice edits — training
 * content churn is low, so replacing is fine.
 */
export async function PATCH(req: NextRequest) {
  const auth = await requireManager();
  if (auth.error) return auth.error;

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const body = await req.json();
  const {
    question_text, question_text_es, question_type, sort_order, active,
  } = body;
  const choices: {
    choice_text?: string; choice_text_es?: string;
    is_correct?: boolean; sort_order?: number;
  }[] | undefined = Array.isArray(body.choices) ? body.choices : undefined;

  const adminClient = getAdminClient();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (question_text !== undefined)    updates.question_text = question_text?.trim() || null;
  if (question_text_es !== undefined) updates.question_text_es = question_text_es?.trim() || null;
  if (question_type !== undefined) {
    if (!['multiple_choice', 'true_false'].includes(question_type)) return NextResponse.json({ error: 'question_type invalid' }, { status: 400 });
    updates.question_type = question_type;
  }
  if (sort_order !== undefined) updates.sort_order = Number(sort_order) || 100;
  if (active !== undefined)     updates.active = !!active;

  const { error: qError } = await adminClient
    .from('quiz_questions').update(updates).eq('id', id);
  if (qError) return NextResponse.json({ error: qError.message }, { status: 400 });

  if (choices) {
    // Replace the choice set.
    await adminClient.from('quiz_choices').delete().eq('question_id', id);
    const qType: 'multiple_choice' | 'true_false' =
      question_type === 'true_false' ? 'true_false' : (question_type === 'multiple_choice' ? 'multiple_choice' :
        // If not changing type, infer from the DB
        (await adminClient.from('quiz_questions').select('question_type').eq('id', id).single()).data?.question_type as 'multiple_choice' | 'true_false' || 'multiple_choice');

    let rows: {
      question_id: string; choice_text: string; choice_text_es: string | null;
      is_correct: boolean; sort_order: number;
    }[];
    if (qType === 'true_false') {
      const trueIsCorrect = choices.some((c) =>
        c.is_correct && (c.choice_text?.toLowerCase() === 'true' || c.choice_text?.toLowerCase() === 'verdadero')
      );
      const flag = trueIsCorrect || (choices.length === 2 && !!choices[0]?.is_correct);
      rows = [
        { question_id: id, choice_text: 'True', choice_text_es: 'Verdadero', is_correct: flag,  sort_order: 100 },
        { question_id: id, choice_text: 'False', choice_text_es: 'Falso',    is_correct: !flag, sort_order: 200 },
      ];
    } else {
      rows = choices.map((c, idx) => ({
        question_id: id,
        choice_text: (c.choice_text ?? '').trim(),
        choice_text_es: c.choice_text_es?.trim() || null,
        is_correct: !!c.is_correct,
        sort_order: typeof c.sort_order === 'number' ? c.sort_order : (idx + 1) * 100,
      }));
    }
    const { error: cError } = await adminClient.from('quiz_choices').insert(rows);
    if (cError) return NextResponse.json({ error: cError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

/**
 * DELETE /api/quizzes/questions?id=<uuid>
 * Hard-delete a question. Choices cascade.
 */
export async function DELETE(req: NextRequest) {
  const auth = await requireManager();
  if (auth.error) return auth.error;

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const adminClient = getAdminClient();
  const { error } = await adminClient.from('quiz_questions').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
