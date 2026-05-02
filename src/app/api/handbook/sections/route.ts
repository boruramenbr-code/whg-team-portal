import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/handbook/sections?language=en
 * Returns the active handbook sections for the requested language.
 * Currently only English is seeded; Spanish will come in a later pass.
 * Requires an authenticated user.
 */
export async function GET(req: NextRequest) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('status')
    .eq('id', user.id)
    .single();
  if (!profile || profile.status === 'archived') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const languageParam = req.nextUrl.searchParams.get('language');
  const language = languageParam === 'es' ? 'es' : 'en';

  // ?audience= filters role_visibility:
  //   'employee' (default) → returns 'employee' + 'all' (what staff sees)
  //   'manager'             → returns 'manager' + 'all' (Manager's Handbook Standards)
  // Manager-audience requires the user to actually be manager-or-admin.
  const audienceParam = req.nextUrl.searchParams.get('audience') === 'manager' ? 'manager' : 'employee';
  let audienceFilter: string[] = ['employee', 'all'];
  if (audienceParam === 'manager') {
    const { data: roleProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    const isManagerLike = ['admin', 'manager', 'assistant_manager'].includes(roleProfile?.role || '');
    if (!isManagerLike) {
      return NextResponse.json({ error: 'Manager Standards is admin/manager only' }, { status: 403 });
    }
    audienceFilter = ['manager', 'all'];
  }

  const selectCols = `
    id, sort_order, title, body, handbook_version, language, role_visibility,
    media:handbook_media(id, sort_order, storage_path, caption, alt_text, active)
  `;

  const { data: sections, error } = await supabase
    .from('handbook_sections')
    .select(selectCols)
    .eq('active', true)
    .eq('language', language)
    .in('role_visibility', audienceFilter)
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Build public URLs for media items so the client can render <img> directly.
  const bucketBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/handbook-media`;

  type RawMedia = { id: string; sort_order: number; storage_path: string; caption: string | null; alt_text: string; active: boolean };
  type RawSection = {
    id: string; sort_order: number; title: string; body: string;
    handbook_version: number; language: string; role_visibility: string;
    media?: RawMedia[];
  };
  const decorate = (rows: RawSection[] | null) =>
    (rows ?? []).map((s) => ({
      ...s,
      media: (s.media ?? [])
        .filter((m) => m.active)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((m) => ({
          id: m.id,
          sort_order: m.sort_order,
          caption: m.caption,
          alt_text: m.alt_text,
          url: `${bucketBase}/${encodeURIComponent(m.storage_path)}`,
        })),
    }));

  // If the requested language has no content (e.g. 'es' before we seed
  // Spanish), fall back to English so the user still sees the handbook.
  if ((!sections || sections.length === 0) && language !== 'en') {
    const { data: fallback } = await supabase
      .from('handbook_sections')
      .select(selectCols)
      .eq('active', true)
      .eq('language', 'en')
      .in('role_visibility', audienceFilter)
      .order('sort_order', { ascending: true });
    return NextResponse.json({
      sections: decorate(fallback as RawSection[] | null),
      language: 'en',
      fallback_used: true,
    });
  }

  return NextResponse.json({
    sections: decorate(sections as RawSection[] | null),
    language,
    fallback_used: false,
  });
}
