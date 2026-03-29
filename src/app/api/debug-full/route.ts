import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = cookies();
  const allCookies = cookieStore.getAll();
  const supabaseCookies = allCookies.filter(
    (c) => c.name.includes('sb-') || c.name.includes('supabase')
  );

  const supabase = createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  let profile = null;
  let profileError = null;

  if (user) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, role, status')
      .eq('id', user.id)
      .single();
    profile = data;
    profileError = error?.message || null;
  }

  return NextResponse.json({
    cookieCount: allCookies.length,
    supabaseCookieCount: supabaseCookies.length,
    supabaseCookieNames: supabaseCookies.map((c) => c.name),
    user: user ? { id: user.id, email: user.email } : null,
    userError: userError?.message || null,
    profile,
    profileError,
  });
}
