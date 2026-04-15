import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { hashPolicyContent } from '@/lib/policies';
import type { Policy } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/policies/sign
 * Body: { policy_id: string, typed_name: string, confirm: boolean }
 *
 * Creates an immutable signature record for the current active version of
 * the policy. The typed full-legal-name and the acknowledgment text at the
 * time of signing are both snapshotted onto the signature row, along with
 * a SHA-256 hash of the signable content.
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

  let body: { policy_id?: string; typed_name?: string; confirm?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { policy_id, typed_name, confirm } = body;

  if (!policy_id || typeof policy_id !== 'string') {
    return NextResponse.json({ error: 'policy_id is required' }, { status: 400 });
  }
  if (!typed_name || typeof typed_name !== 'string' || typed_name.trim().length < 2) {
    return NextResponse.json({ error: 'Full legal name is required' }, { status: 400 });
  }
  if (confirm !== true) {
    return NextResponse.json({ error: 'You must confirm you have read and understand the policy' }, { status: 400 });
  }

  // Light validation: the typed name should roughly match the profile name.
  // Not strict — people sign with middle initials, hyphens, married names, etc.
  const normalizedTyped = typed_name.trim().toLowerCase().replace(/\s+/g, ' ');
  const normalizedProfile = profile.full_name.trim().toLowerCase().replace(/\s+/g, ' ');
  const typedParts = normalizedTyped.split(' ');
  const profileParts = normalizedProfile.split(' ');
  const overlaps = typedParts.some((p) => profileParts.includes(p));
  if (!overlaps) {
    return NextResponse.json({
      error: 'Typed name does not appear to match your profile name. Please type your full legal name as it appears on your W-4.',
    }, { status: 400 });
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

  const { data: inserted, error: insErr } = await supabase
    .from('policy_signatures')
    .insert({
      policy_id: typedPolicy.id,
      policy_version: typedPolicy.version,
      user_id: user.id,
      restaurant_id_at_signing: profile.restaurant_id,
      role_at_signing: profile.role === 'assistant_manager' ? 'manager' : profile.role,
      employee_name_typed: typed_name.trim(),
      acknowledgment_text_signed: typedPolicy.acknowledgment_text,
      content_hash,
    })
    .select()
    .single();

  if (insErr) {
    // Unique violation — already signed this version.
    if ((insErr as { code?: string }).code === '23505') {
      return NextResponse.json({
        error: 'You have already signed this version of this policy.',
      }, { status: 409 });
    }
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, signature: inserted });
}
