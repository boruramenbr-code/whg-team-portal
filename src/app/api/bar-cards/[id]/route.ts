import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const MANAGER_ROLES = ['admin', 'manager', 'assistant_manager'];

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * PATCH /api/bar-cards/[id]
 * Update employee name, expiration date, or notes.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
  const adminClient = getAdminClient();

  // Verify the card exists
  const { data: card } = await adminClient
    .from('bar_cards')
    .select('id, restaurant_id')
    .eq('id', params.id)
    .single();

  if (!card) {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 });
  }

  // Non-admin managers can only update cards at their own restaurant
  if (profile.role !== 'admin' && card.restaurant_id !== profile.restaurant_id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // Only allow updating specific fields
  const allowedFields = ['employee_name', 'expiration_date', 'notes', 'archived'];
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      update[field] = body[field];
    }
  }

  const { error } = await adminClient
    .from('bar_cards')
    .update(update)
    .eq('id', params.id);

  if (error) {
    console.error('Bar card update failed:', error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

/**
 * DELETE /api/bar-cards/[id]
 * Remove a bar card and its image from storage.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

  const adminClient = getAdminClient();

  // Fetch the card to get the image path
  const { data: card } = await adminClient
    .from('bar_cards')
    .select('id, restaurant_id, card_image_url')
    .eq('id', params.id)
    .single();

  if (!card) {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 });
  }

  if (profile.role !== 'admin' && card.restaurant_id !== profile.restaurant_id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // Remove image from storage
  if (card.card_image_url) {
    const bucketPath = card.card_image_url.split('/bar-cards/')[1];
    if (bucketPath) {
      await adminClient.storage.from('bar-cards').remove([decodeURIComponent(bucketPath)]);
    }
  }

  // Delete the record
  const { error } = await adminClient
    .from('bar_cards')
    .delete()
    .eq('id', params.id);

  if (error) {
    console.error('Bar card delete failed:', error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
