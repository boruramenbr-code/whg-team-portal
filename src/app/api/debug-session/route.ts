import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = cookies();
  const allCookies = cookieStore.getAll();
  const supabaseCookies = allCookies.filter(c => c.name.includes('sb-') || c.name.includes('supabase'));

  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  const sbCookieValue = supabaseCookies[0]?.value || '';
  let valueFormat = 'unknown';
  try { JSON.parse(sbCookieValue); valueFormat = 'raw-json'; } catch {
    try { JSON.parse(decodeURIComponent(sbCookieValue)); valueFormat = 'url-encoded-json'; } catch {
      try { JSON.parse(Buffer.from(sbCookieValue, 'base64').toString()); valueFormat = 'base64-json'; } catch {
        valueFormat = 'other';
      }
    }
  }

  return NextResponse.json({
    user: user ? { id: user.id, email: user.email } : null,
    error: error?.message || null,
    cookieCount: allCookies.length,
    supabaseCookieNames: supabaseCookies.map(c => c.name),
    valuePreview: sbCookieValue.slice(0, 80),
    valueFormat,
    valueLength: sbCookieValue.length,
  });
}
