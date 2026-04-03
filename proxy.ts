import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16 Proxy (formerly middleware.ts).
 *
 * Two responsibilities:
 * 1. Refresh the Supabase Auth session on every request so that Server
 *    Components always receive a non-expired token.
 * 2. Guard auth-required routes — unauthenticated visitors are redirected to
 *    /login with a `next` param so they can be sent back after signing in.
 *
 * Important: auth checks inside server actions (via requireAuth()) are the
 * primary enforcement layer.  This proxy adds a UX-level redirect so users
 * are not sent to a broken page, but it is NOT the sole security boundary.
 * See: https://nextjs.org/docs/app/guides/data-security
 */
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write refreshed session cookies back onto both the mutated request
          // and the new response so the session is available in the same
          // render pass downstream.
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

  // Use getUser() — validates the JWT server-side rather than just reading
  // the cookie, so expired / revoked tokens are detected correctly.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Routes that require a valid session.
  const protectedPaths = ["/create", "/dashboard"];
  const isProtected = protectedPaths.some((p) =>
    request.nextUrl.pathname.startsWith(p)
  );

  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/sign-in";
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Run on all paths except Next.js internals and static assets.
     * Session refresh must happen on every real page/API request.
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
