import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = cookies();
  const allCookies = cookieStore.getAll();
  const supabaseCookies = allCookies.filter(c => c.name.includes('sb-') || c.name.includes('supabase'));

  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  return NextResponse.json({
    user: user ? { id: user.id, email: user.email } : null,
    error: error?.message || null,
    cookieCount: allCookies.length,
    supabaseCookieNames: supabaseCookies.map(c => c.name),
  });
}
