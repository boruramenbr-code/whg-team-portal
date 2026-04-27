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
 * POST /api/org-chart/photo
 * Upload a profile photo for an org chart position.
 * Body: FormData with fields:
 *   - file: the image file
 *   - positionId: the org_chart_positions.id to update
 *
 * Requires manager+ role. Stores image in Supabase Storage bucket "team-photos".
 */
export async function POST(req: NextRequest) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, restaurant_id, status')
    .eq('id', user.id)
    .single();

  if (!profile || profile.status === 'archived') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (!MANAGER_ROLES.includes(profile.role)) {
    return NextResponse.json({ error: 'Only managers can upload photos' }, { status: 403 });
  }

  // Parse form data
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const positionId = formData.get('positionId') as string | null;

  if (!file || !positionId) {
    return NextResponse.json({ error: 'File and positionId are required' }, { status: 400 });
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, and WebP images are allowed' }, { status: 400 });
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File must be under 5MB' }, { status: 400 });
  }

  // Verify the position exists and belongs to a restaurant this user can manage
  const { data: position } = await supabase
    .from('org_chart_positions')
    .select('id, restaurant_id, first_name, last_initial, role_level')
    .eq('id', positionId)
    .single();

  if (!position) {
    return NextResponse.json({ error: 'Position not found' }, { status: 404 });
  }

  // Non-admin managers can only update positions at their own restaurant
  if (profile.role !== 'admin' && position.restaurant_id !== profile.restaurant_id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const adminClient = getAdminClient();

  // Generate a unique file path
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filePath = `${position.restaurant_id}/${positionId}.${ext}`;

  // Upload to Supabase Storage (overwrite if exists)
  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await adminClient.storage
    .from('team-photos')
    .upload(filePath, arrayBuffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    console.error('Photo upload failed:', uploadError.message);
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 });
  }

  // Get the public URL
  const { data: urlData } = adminClient.storage
    .from('team-photos')
    .getPublicUrl(filePath);

  const publicUrl = urlData.publicUrl;

  // Update the position's photo_url
  const { error: updateError } = await adminClient
    .from('org_chart_positions')
    .update({ photo_url: publicUrl })
    .eq('id', positionId);

  if (updateError) {
    console.error('Failed to update photo_url:', updateError.message);
    return NextResponse.json({ error: 'Photo uploaded but failed to save. Contact admin.' }, { status: 500 });
  }

  // Sync owner photos across all restaurants.
  // If this is an ownership-level position (level 1), find matching positions
  // at other restaurants with the same name and update their photo too.
  if (position.role_level === 1) {
    await adminClient
      .from('org_chart_positions')
      .update({ photo_url: publicUrl })
      .eq('first_name', position.first_name)
      .eq('last_initial', position.last_initial)
      .eq('role_level', 1)
      .neq('id', positionId);
  }

  return NextResponse.json({ success: true, photo_url: publicUrl });
}

/**
 * DELETE /api/org-chart/photo?positionId=<uuid>
 * Remove a profile photo from an org chart position.
 */
export async function DELETE(req: NextRequest) {
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

  const positionId = req.nextUrl.searchParams.get('positionId');
  if (!positionId) {
    return NextResponse.json({ error: 'positionId is required' }, { status: 400 });
  }

  const { data: position } = await supabase
    .from('org_chart_positions')
    .select('id, restaurant_id, photo_url, first_name, last_initial, role_level')
    .eq('id', positionId)
    .single();

  if (!position) {
    return NextResponse.json({ error: 'Position not found' }, { status: 404 });
  }

  if (profile.role !== 'admin' && position.restaurant_id !== profile.restaurant_id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const adminClient = getAdminClient();

  // Remove from storage if there's a photo
  if (position.photo_url) {
    const bucketPath = position.photo_url.split('/team-photos/')[1];
    if (bucketPath) {
      await adminClient.storage.from('team-photos').remove([decodeURIComponent(bucketPath)]);
    }
  }

  // Clear the photo_url
  await adminClient
    .from('org_chart_positions')
    .update({ photo_url: null })
    .eq('id', positionId);

  // Sync removal across all restaurants for owners (level 1)
  if (position.role_level === 1) {
    await adminClient
      .from('org_chart_positions')
      .update({ photo_url: null })
      .eq('first_name', position.first_name)
      .eq('last_initial', position.last_initial)
      .eq('role_level', 1)
      .neq('id', positionId);
  }

  return NextResponse.json({ success: true });
}
