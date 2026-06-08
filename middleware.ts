import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ── Rate limiter for public APIs ─────────────────────────────────────────────
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

function pruneRateLimitStore() {
  const now = Date.now();
  for (const [key, val] of rateLimitStore.entries()) {
    if (now > val.resetAt) rateLimitStore.delete(key);
  }
}

function getIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Block direct /admin access — return 404 ──────────────────────────────
  // Real admin is served via /portal (see next.config.ts rewrites)
  if (pathname.startsWith("/admin")) {
    return new NextResponse(null, { status: 404 });
  }

  // ── Rate-limit public API endpoints ─────────────────────────────────────
  if (pathname.startsWith("/api/bookings") || pathname.startsWith("/api/inquiries")) {
    pruneRateLimitStore();
    if (isRateLimited(getIp(request))) {
      return new NextResponse(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: { "Content-Type": "application/json", "Retry-After": "60" },
      });
    }
  }

  // ── Block confirm/reject from external callers ───────────────────────────
  if (
    pathname === "/api/bookings/confirm" ||
    pathname === "/api/bookings/reject"
  ) {
    const referer = request.headers.get("referer") ?? "";
    const origin = request.headers.get("origin") ?? "";
    const host = request.headers.get("host") ?? "";
    const isInternal = referer.includes(host) || origin.includes(host) || origin === "";
    if (!isInternal) {
      return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // ── Supabase auth — protect /portal (the real admin path) ───────────────
  // Note: /portal/* is rewritten to /admin/* by next.config.ts rewrites,
  // so middleware sees /portal/* before the rewrite happens.
  if (pathname.startsWith("/portal")) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/portal/:path*",
    "/portal",
    "/api/bookings/:path*",
    "/api/inquiries/:path*",
  ],
};
