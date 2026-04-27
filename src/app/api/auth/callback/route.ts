import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    // Log the failure so we can debug auth issues in Vercel logs
    console.error('Auth callback failed:', error.message, { code: code.slice(0, 8) + '...' });
  } else {
    console.error('Auth callback called without code param');
  }

  return NextResponse.redirect(`${origin}/?error=auth_callback_failed`);
}
