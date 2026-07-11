import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const MANAGER_ROLES = ['admin', 'manager', 'assistant_manager'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB — client compresses to ~0.5-2MB first
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * POST /api/menu/items/photo
 * FormData: { id: <menu_item uuid>, file: <image> }
 *
 * Uploads the photo to the public menu-photos bucket and stamps
 * menu_items.photo_url. Manager+ only, restaurant-scoped. Storage keys
 * are slugified (bar-cards lesson: Supabase rejects commas/accents).
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

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const itemId = formData.get('id') as string | null;

  if (!file || !itemId) {
    return NextResponse.json({ error: 'file and id are required' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, and WebP images are allowed' }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File must be under 5MB' }, { status: 400 });
  }

  const adminClient = getAdminClient();
  const { data: item } = await adminClient
    .from('menu_items')
    .select('restaurant_id, name, photo_url')
    .eq('id', itemId)
    .single();
  if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

  // Non-admin managers can only touch restaurants they're assigned to.
  if (profile.role !== 'admin' && item.restaurant_id !== profile.restaurant_id) {
    const { data: extra } = await adminClient
      .from('user_locations')
      .select('restaurant_id')
      .eq('profile_id', user.id)
      .eq('restaurant_id', item.restaurant_id)
      .maybeSingle();
    if (!extra) return NextResponse.json({ error: 'Access denied for this restaurant' }, { status: 403 });
  }

  const rawExt = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const ext = ['jpg', 'jpeg', 'png', 'webp'].includes(rawExt) ? rawExt : 'jpg';
  const safeName = item.name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase()
    .slice(0, 60) || 'item';
  const filePath = `${item.restaurant_id}/${Date.now()}-${safeName}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await adminClient.storage
    .from('menu-photos')
    .upload(filePath, arrayBuffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error('Menu photo upload failed:', uploadError.message);
    return NextResponse.json(
      { error: `Storage upload failed: ${uploadError.message}` },
      { status: 500 }
    );
  }

  const { data: urlData } = adminClient.storage.from('menu-photos').getPublicUrl(filePath);

  const { error: updateError } = await adminClient
    .from('menu_items')
    .update({ photo_url: urlData.publicUrl, updated_at: new Date().toISOString() })
    .eq('id', itemId);

  if (updateError) {
    console.error('Menu photo url update failed:', updateError.message);
    return NextResponse.json({ error: 'Photo uploaded but saving failed. Try again.' }, { status: 500 });
  }

  // Best-effort cleanup of the replaced photo so the bucket doesn't
  // accumulate orphans. Failure here is harmless.
  if (item.photo_url) {
    const oldKey = item.photo_url.split('/menu-photos/')[1];
    if (oldKey) {
      adminClient.storage.from('menu-photos').remove([decodeURIComponent(oldKey)]).then(() => {});
    }
  }

  return NextResponse.json({ success: true, photo_url: urlData.publicUrl });
}
