import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/tips/[id] — update a tip entry's fields
 * DELETE /api/tips/[id] — remove a tip entry
 *
 * Both use the request-bound supabase client so RLS enforces
 * owner-only access. A user attempting to PATCH/DELETE someone
 * else's entry receives 0 rows touched (Postgres silently denies),
 * which we surface as 404.
 */

const ALLOWED_SHIFT_TYPES = new Set(['lunch', 'mid', 'dinner', 'other']);

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { shift_date?: string; shift_type?: string; cash_tips?: number; notes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};

  if (body.shift_date !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.shift_date)) {
      return NextResponse.json({ error: 'shift_date must be YYYY-MM-DD' }, { status: 400 });
    }
    patch.shift_date = body.shift_date;
  }
  if (body.shift_type !== undefined) {
    if (!ALLOWED_SHIFT_TYPES.has(body.shift_type)) {
      return NextResponse.json({ error: 'shift_type must be lunch, mid, dinner, or other' }, { status: 400 });
    }
    patch.shift_type = body.shift_type;
  }
  if (body.cash_tips !== undefined) {
    const amount = Number(body.cash_tips);
    if (!Number.isFinite(amount) || amount < 0) {
      return NextResponse.json({ error: 'cash_tips must be a non-negative number' }, { status: 400 });
    }
    patch.cash_tips = amount;
  }
  if (body.notes !== undefined) {
    patch.notes = body.notes?.trim() || null;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  patch.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('tip_entries')
    .update(patch)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    if ((error as { code?: string }).code === '23505') {
      return NextResponse.json({
        error: 'You already have a tip entry for that shift on that date.',
      }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ entry: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabase
    .from('tip_entries')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
