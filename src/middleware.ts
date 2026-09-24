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
  const isProtected = path.startsWith('/dashboard') || path.startsWith('/admin') || path.startsWith('/resources');
  const isGet = request.method === 'GET';

  // Only apply redirects on GET requests — POST requests are Server Actions
  // and must not be intercepted or they fail with "failed to forward action response"
  if (isGet) {
    if (!user && isProtected) {
      const login = new URL('/', request.url);
      // Keep shared training links (Asana tasks, texts) alive through sign-in.
      if (request.nextUrl.search) {
        login.searchParams.set('next', path + request.nextUrl.search);
      }
      return NextResponse.redirect(login);
    }
    if (user && isLoginPage) {
      const next = request.nextUrl.searchParams.get('next');
      const dest = next && /^\/(dashboard|admin)(\/|\?|$)/.test(next) ? next : '/dashboard';
      return NextResponse.redirect(new URL(dest, request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/', '/dashboard', '/dashboard/:path*', '/admin', '/admin/:path*', '/resources', '/resources/:path*'],
};
