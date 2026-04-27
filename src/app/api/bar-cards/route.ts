import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const MANAGER_ROLES = ['admin', 'manager', 'assistant_manager'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * GET /api/bar-cards?restaurantId=<uuid>
 * List all bar cards for a restaurant. Manager+ only.
 */
export async function GET(req: NextRequest) {
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

  const restaurantId = req.nextUrl.searchParams.get('restaurantId') || profile.restaurant_id;

  // Non-admin managers can only see their own restaurant
  if (profile.role !== 'admin' && restaurantId !== profile.restaurant_id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const { data: cards, error } = await supabase
    .from('bar_cards')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('expiration_date', { ascending: true });

  if (error) {
    console.error('Failed to fetch bar cards:', error.message);
    return NextResponse.json({ error: 'Failed to load bar cards' }, { status: 500 });
  }

  return NextResponse.json({ cards: cards || [] });
}

/**
 * POST /api/bar-cards
 * Upload a new bar card. Body: FormData with fields:
 *   - file: the card image
 *   - restaurantId: uuid
 *   - employeeName: string
 *   - expirationDate: YYYY-MM-DD
 *   - notes: optional string
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
  const restaurantId = formData.get('restaurantId') as string | null;
  const employeeName = formData.get('employeeName') as string | null;
  const expirationDate = formData.get('expirationDate') as string | null;
  const notes = formData.get('notes') as string | null;

  if (!file || !restaurantId || !employeeName || !expirationDate) {
    return NextResponse.json({ error: 'File, restaurantId, employeeName, and expirationDate are required' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, and WebP images are allowed' }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File must be under 5MB' }, { status: 400 });
  }

  // Non-admin managers can only upload to their own restaurant
  if (profile.role !== 'admin' && restaurantId !== profile.restaurant_id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const adminClient = getAdminClient();

  // Upload image to storage
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const timestamp = Date.now();
  const filePath = `${restaurantId}/${timestamp}-${employeeName.replace(/\s+/g, '_').toLowerCase()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await adminClient.storage
    .from('bar-cards')
    .upload(filePath, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error('Bar card upload failed:', uploadError.message);
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 });
  }

  // Get public URL
  const { data: urlData } = adminClient.storage
    .from('bar-cards')
    .getPublicUrl(filePath);

  // Insert record
  const { data: card, error: insertError } = await adminClient
    .from('bar_cards')
    .insert({
      restaurant_id: restaurantId,
      employee_name: employeeName.trim(),
      expiration_date: expirationDate,
      card_image_url: urlData.publicUrl,
      notes: notes?.trim() || null,
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Bar card insert failed:', insertError.message);
    return NextResponse.json({ error: 'Failed to save bar card record.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, card });
}
