import { createClient as createServerClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const FALLBACK_QUESTIONS = [
  'What is the meal discount policy?',
  'What is the attendance and call-out policy?',
  'What are the dress code requirements?',
  'What is the progressive discipline policy?',
  'What is the policy for phone use?',
];

export async function GET() {
  // Require authenticated user
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Service role to read all questions across all users
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data } = await admin
    .from('chat_history')
    .select('question')
    .order('created_at', { ascending: false })
    .limit(1000);

  if (!data || data.length === 0) {
    return NextResponse.json({
      questions: FALLBACK_QUESTIONS.map((q) => ({ question: q, count: 0 })),
    });
  }

  // Count and rank
  const counts: Record<string, number> = {};
  for (const row of data) {
    const q = row.question.trim();
    counts[q] = (counts[q] || 0) + 1;
  }

  const popular = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([question, count]) => ({ question, count }));

  return NextResponse.json({ questions: popular });
}
