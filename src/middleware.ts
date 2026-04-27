import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Add request ID for log correlation and debugging
  const requestId = crypto.randomUUID().slice(0, 8);
  let supabaseResponse = NextResponse.next({ request });
  supabaseResponse.headers.set('x-request-id', requestId);

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
    if (user && isLoginPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/', '/dashboard', '/dashboard/:path*', '/admin', '/admin/:path*'],
};
