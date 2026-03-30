import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Determine credentials based on login mode:
  //   Staff PIN login:       { profileId, pin }
  //   Manager/Admin login:   { email, password }
  let email: string;
  let password: string;
  const isPinLogin = !!(body.profileId && body.pin);

  if (isPinLogin) {
    email = `${body.profileId}@whg.staff`;
    password = `WHG${body.pin}!staff`;
  } else if (body.email && body.password) {
    email = body.email.trim();
    password = body.password;
  } else {
    return NextResponse.json({ error: 'Missing login credentials' }, { status: 400 });
  }

  // Pre-build the success response so we can set cookies directly on it
  const response = NextResponse.json({ success: true });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options as CookieOptions);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const message =
      error.message === 'Invalid login credentials'
        ? isPinLogin
          ? 'Incorrect PIN. Please try again.'
          : 'Incorrect email or password. Please try again.'
        : error.message;
    return NextResponse.json({ error: message }, { status: 401 });
  }

  return response;
}
