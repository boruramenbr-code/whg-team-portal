import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

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
          // Write cookies directly onto the response object — no encoding issues
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options as CookieOptions);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json(
      {
        error:
          error.message === 'Invalid login credentials'
            ? 'Incorrect email or password. Please try again.'
            : error.message,
      },
      { status: 401 }
    );
  }

  // Return the response — it now carries proper Set-Cookie headers
  return response;
}
