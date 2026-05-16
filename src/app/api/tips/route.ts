import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * Tip Tracker API — private to the authenticated user.
 *
 * Uses the regular request-bound supabase client so Postgres RLS
 * enforces owner-only access. There is NO admin client path for
 * reading tip entries — manager/admin cannot pull anyone else's
 * data through this route, by design.
 *
 * GET  /api/tips         — list current user's entries, newest first
 * POST /api/tips         — create entry { shift_date, shift_type, cash_tips, notes? }
 */

const ALLOWED_SHIFT_TYPES = new Set(['lunch', 'mid', 'dinner', 'other']);

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Optional date range filtering for summary calculations
  const url = new URL(req.url);
  const since = url.searchParams.get('since'); // YYYY-MM-DD
  const until = url.searchParams.get('until');

  let q = supabase
    .from('tip_entries')
    .select('id, shift_date, shift_type, cash_tips, notes, created_at, updated_at')
    .eq('user_id', user.id)
    .order('shift_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (since) q = q.gte('shift_date', since);
  if (until) q = q.lte('shift_date', until);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ entries: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { shift_date?: string; shift_type?: string; cash_tips?: number; notes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { shift_date, shift_type, cash_tips, notes } = body;

  if (!shift_date || !/^\d{4}-\d{2}-\d{2}$/.test(shift_date)) {
    return NextResponse.json({ error: 'shift_date must be YYYY-MM-DD' }, { status: 400 });
  }
  if (!shift_type || !ALLOWED_SHIFT_TYPES.has(shift_type)) {
    return NextResponse.json({ error: 'shift_type must be lunch, mid, dinner, or other' }, { status: 400 });
  }
  const amount = Number(cash_tips);
  if (!Number.isFinite(amount) || amount < 0) {
    return NextResponse.json({ error: 'cash_tips must be a non-negative number' }, { status: 400 });
  }

  // user_id is set explicitly so RLS with-check accepts it
  const { data, error } = await supabase
    .from('tip_entries')
    .insert({
      user_id: user.id,
      shift_date,
      shift_type,
      cash_tips: amount,
      notes: notes?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    // 23505 = unique violation — they already logged that shift_type for that date
    if ((error as { code?: string }).code === '23505') {
      return NextResponse.json({
        error: 'You already logged a tip entry for that shift. Edit the existing one instead.',
      }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entry: data });
}
