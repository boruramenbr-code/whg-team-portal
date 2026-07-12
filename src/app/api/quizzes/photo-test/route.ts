import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const MANAGER_ROLES = ['admin', 'manager', 'assistant_manager'];
const TITLE_PREFIX = '📸 Menu Photo Test';

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * POST /api/quizzes/photo-test
 * Body: { restaurant_id, question_count?=25 (5-60), pass_threshold?=70 }
 *
 * Auto-generates the "name that dish" exam from the restaurant's menu:
 * each question shows an item photo with 4 name choices — the right one
 * plus 3 decoys pulled from the same category first (hardest to tell
 * apart), then anywhere else. Regenerating deactivates the previous
 * photo test (old attempts stay on the old quiz for history) and creates
 * a fresh one with newly randomized questions. Manager+ only.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, restaurant_id, status')
    .eq('id', user.id)
    .single();

  if (!profile || profile.status === 'archived' || !MANAGER_ROLES.includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const restaurantId: string | null = body.restaurant_id || profile.restaurant_id;
  if (!restaurantId) return NextResponse.json({ error: 'restaurant_id is required' }, { status: 400 });

  // Non-admin managers: own restaurant or a user_locations assignment.
  if (profile.role !== 'admin' && restaurantId !== profile.restaurant_id) {
    const { data: extra } = await supabase
      .from('user_locations')
      .select('restaurant_id')
      .eq('profile_id', user.id)
      .eq('restaurant_id', restaurantId)
      .maybeSingle();
    if (!extra) return NextResponse.json({ error: 'Access denied for this restaurant' }, { status: 403 });
  }

  const requestedCount = Number(body.question_count) || 25;
  const questionCount = Math.max(5, Math.min(60, requestedCount));
  const passRaw = Number(body.pass_threshold);
  const passThreshold = Number.isInteger(passRaw) && passRaw >= 0 && passRaw <= 100 ? passRaw : 70;

  const adminClient = getAdminClient();

  const [{ data: restaurant }, { data: items }] = await Promise.all([
    adminClient.from('restaurants').select('id, name').eq('id', restaurantId).single(),
    adminClient
      .from('menu_items')
      .select('id, name, name_es, category_id, photo_url')
      .eq('restaurant_id', restaurantId)
      .eq('active', true)
      .not('photo_url', 'is', null),
  ]);

  if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
  if (!items || items.length < 8) {
    return NextResponse.json(
      { error: `Need at least 8 menu items with photos to build a photo test (found ${items?.length ?? 0}).` },
      { status: 400 }
    );
  }

  const picked = shuffle(items).slice(0, Math.min(questionCount, items.length));

  // Retire the previous photo test so only one is live at a time.
  // Old attempts stay attached to the old quiz — history is preserved.
  await adminClient
    .from('quizzes')
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq('restaurant_id', restaurantId)
    .like('title', `${TITLE_PREFIX}%`);

  const { data: quiz, error: quizError } = await adminClient
    .from('quizzes')
    .insert({
      title: `${TITLE_PREFIX} — ${restaurant.name}`,
      title_es: `📸 Examen de Fotos del Menú — ${restaurant.name}`,
      description: `Know your menu by sight. ${picked.length} dishes from the ${restaurant.name} menu — name each one from its photo.`,
      description_es: `Conoce tu menú de vista. ${picked.length} platillos del menú de ${restaurant.name} — nombra cada uno por su foto.`,
      kind: 'exam',
      restaurant_id: restaurantId,
      pass_threshold: passThreshold,
      applies_to: 'all',
    })
    .select()
    .single();

  if (quizError || !quiz) {
    return NextResponse.json({ error: quizError?.message || 'Failed to create quiz' }, { status: 500 });
  }

  // Build every question, decoys from the same category first.
  for (let i = 0; i < picked.length; i++) {
    const item = picked[i];
    const sameCategory = items.filter((x) => x.id !== item.id && x.category_id === item.category_id);
    const others = items.filter((x) => x.id !== item.id && x.category_id !== item.category_id);
    const decoys = shuffle(sameCategory).slice(0, 3);
    if (decoys.length < 3) decoys.push(...shuffle(others).slice(0, 3 - decoys.length));

    const { data: question, error: qError } = await adminClient
      .from('quiz_questions')
      .insert({
        quiz_id: quiz.id,
        question_text: 'What is this dish called?',
        question_text_es: '¿Cómo se llama este platillo?',
        question_type: 'multiple_choice',
        image_url: item.photo_url,
        sort_order: (i + 1) * 100,
      })
      .select()
      .single();
    if (qError || !question) {
      return NextResponse.json({ error: `Failed at question ${i + 1}: ${qError?.message}` }, { status: 500 });
    }

    const choices = shuffle([item, ...decoys]).map((c, idx) => ({
      question_id: question.id,
      choice_text: c.name,
      choice_text_es: c.name_es,
      is_correct: c.id === item.id,
      sort_order: (idx + 1) * 100,
    }));
    const { error: cError } = await adminClient.from('quiz_choices').insert(choices);
    if (cError) {
      return NextResponse.json({ error: `Failed choices for question ${i + 1}: ${cError.message}` }, { status: 500 });
    }
  }

  return NextResponse.json({
    success: true,
    quiz_id: quiz.id,
    title: quiz.title,
    question_count: picked.length,
    pass_threshold: passThreshold,
  });
}
