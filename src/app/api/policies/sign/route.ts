import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { hashPolicyContent } from '@/lib/policies';
import type { Policy } from '@/lib/types';

export const dynamic = 'force-dynamic';

function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * POST /api/policies/sign
 * Body: {
 *   policy_id: string,
 *   confirm: boolean,
 *   signature_image?: string,   // data URL ("data:image/png;base64,...")
 *   typed_name?: string,        // legacy typed-name flow (still supported)
 * }
 *
 * Creates an immutable signature record for the current active version of
 * the policy. Two signing modes are supported:
 *
 *   1) Handwritten (preferred) — caller sends `signature_image` as a PNG
 *      data URL. We upload it to Storage at signatures/{user_id}/{policy_id}_v{version}.png
 *      and snapshot the storage path on the signature row. The employee's
 *      legal name is taken from their profile (no typing required).
 *
 *   2) Typed-name (legacy) — caller sends `typed_name`. We validate the
 *      typed name overlaps the profile name and snapshot it.
 *
 * In both cases the acknowledgment text at the time of signing is snapshotted,
 * along with a SHA-256 hash of the signable content.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role, restaurant_id, status')
    .eq('id', user.id)
    .single();

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  if (profile.status === 'archived') {
    return NextResponse.json({ error: 'Account archived' }, { status: 403 });
  }

  let body: {
    policy_id?: string;
    typed_name?: string;
    confirm?: boolean;
    signature_image?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { policy_id, typed_name, confirm, signature_image } = body;

  if (!policy_id || typeof policy_id !== 'string') {
    return NextResponse.json({ error: 'policy_id is required' }, { status: 400 });
  }
  if (confirm !== true) {
    return NextResponse.json({ error: 'You must confirm you have read and understand the policy' }, { status: 400 });
  }

  const hasImage = typeof signature_image === 'string' && signature_image.startsWith('data:image/');
  const hasTyped = typeof typed_name === 'string' && typed_name.trim().length >= 2;

  if (!hasImage && !hasTyped) {
    return NextResponse.json({
      error: 'A handwritten signature or typed full legal name is required',
    }, { status: 400 });
  }

  // If using the legacy typed-name flow, run name-overlap validation.
  if (!hasImage && hasTyped) {
    const normalizedTyped = typed_name!.trim().toLowerCase().replace(/\s+/g, ' ');
    const normalizedProfile = profile.full_name.trim().toLowerCase().replace(/\s+/g, ' ');
    const typedParts = normalizedTyped.split(' ');
    const profileParts = normalizedProfile.split(' ');
    const overlaps = typedParts.some((p) => profileParts.includes(p));
    if (!overlaps) {
      return NextResponse.json({
        error: 'Typed name does not appear to match your profile name. Please type your full legal name as it appears on your W-4.',
      }, { status: 400 });
    }
  }

  const { data: policy, error: polErr } = await supabase
    .from('policies')
    .select('*')
    .eq('id', policy_id)
    .eq('active', true)
    .single();

  if (polErr || !policy) {
    return NextResponse.json({ error: 'Policy not found or inactive' }, { status: 404 });
  }

  const typedPolicy = policy as Policy;
  const content_hash = hashPolicyContent(typedPolicy);

  // Upload the signature image (if provided) to Storage before inserting the
  // signature row, so we can stamp the path onto the row.
  let signature_image_url: string | null = null;
  if (hasImage) {
    const base64Match = signature_image!.match(/^data:image\/(png|jpeg|jpg|svg\+xml);base64,(.+)$/);
    if (!base64Match) {
      return NextResponse.json({ error: 'Invalid signature image format' }, { status: 400 });
    }
    const [, mimeSubtype, base64Body] = base64Match;
    const contentType = `image/${mimeSubtype === 'jpg' ? 'jpeg' : mimeSubtype}`;
    const extension = mimeSubtype === 'svg+xml' ? 'svg' : mimeSubtype === 'jpg' ? 'jpeg' : mimeSubtype;

    let buffer: Buffer;
    try {
      buffer = Buffer.from(base64Body, 'base64');
    } catch {
      return NextResponse.json({ error: 'Could not decode signature image' }, { status: 400 });
    }
    if (buffer.byteLength > 524288) {
      return NextResponse.json({ error: 'Signature image too large (max 512KB)' }, { status: 400 });
    }

    // Use the admin client so the upload doesn't depend on RLS — the row
    // we're about to insert is the auditable record of who signed.
    const admin = getAdminClient();
    const storagePath = `${user.id}/${typedPolicy.id}_v${typedPolicy.version}_${Date.now()}.${extension}`;
    const { error: upErr } = await admin.storage
      .from('signatures')
      .upload(storagePath, buffer, { contentType, upsert: false });
    if (upErr) {
      return NextResponse.json({ error: `Failed to store signature: ${upErr.message}` }, { status: 500 });
    }
    signature_image_url = storagePath;
  }

  // Always snapshot a typed legal name on the row for the audit record.
  // Prefer what the user typed (legacy flow); otherwise fall back to profile.
  const employee_name_typed = hasTyped ? typed_name!.trim() : profile.full_name.trim();

  const { data: inserted, error: insErr } = await supabase
    .from('policy_signatures')
    .insert({
      policy_id: typedPolicy.id,
      policy_version: typedPolicy.version,
      user_id: user.id,
      restaurant_id_at_signing: profile.restaurant_id,
      role_at_signing: profile.role === 'assistant_manager' ? 'manager' : profile.role,
      employee_name_typed,
      acknowledgment_text_signed: typedPolicy.acknowledgment_text,
      content_hash,
      signature_image_url,
    })
    .select()
    .single();

  if (insErr) {
    // Unique violation — already signed this version. Clean up the image we
    // just uploaded so we don't leave an orphan.
    if ((insErr as { code?: string }).code === '23505') {
      if (signature_image_url) {
        try {
          const admin = getAdminClient();
          await admin.storage.from('signatures').remove([signature_image_url]);
        } catch { /* best effort */ }
      }
      return NextResponse.json({
        error: 'You have already signed this version of this policy.',
      }, { status: 409 });
    }
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, signature: inserted });
}
