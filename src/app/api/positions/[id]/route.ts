import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * PATCH /api/positions/[id]
 *
 * Admin-only. Updates a position's description, name, emoji, or sort_order.
 * Used by the admin "Edit Position" UI when Randy fills in or refines
 * position descriptions.
 *
 * Body: { description?, name?, emoji?, sort_order?, active? }
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!me || me.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const body = await req.json();
  const updates: Record<string, unknown> = {};
  if (typeof body.description === 'string' || body.description === null) updates.description = body.description;
  if (typeof body.name === 'string' && body.name.trim()) updates.name = body.name.trim();
  if (typeof body.emoji === 'string' && body.emoji.trim()) updates.emoji = body.emoji.trim();
  if (typeof body.sort_order === 'number') updates.sort_order = body.sort_order;
  if (typeof body.active === 'boolean') updates.active = body.active;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 });
  }

  // Use admin client to bypass RLS — RLS UPDATE checks pass anyway
  // for admin role, but admin client gives us reliable error reporting.
  const adminClient = getAdminClient();
  const { data, error } = await adminClient
    .from('positions')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ position: data });
}
