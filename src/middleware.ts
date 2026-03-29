import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isLoginPage = path === '/';
  const isProtected = path.startsWith('/dashboard') || path.startsWith('/admin');
  const isGet = request.method === 'GET';

  // Only apply redirects on GET requests — POST requests are Server Actions
  // and must not be intercepted or they fail with "failed to forward action response"
  if (isGet) {
    if (!user && isProtected) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    // Do NOT redirect authenticated users from '/' — avoids redirect loops
    // when the dashboard encounters an error and redirects back to '/'
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/', '/dashboard', '/dashboard/:path*', '/admin', '/admin/:path*'],
};
