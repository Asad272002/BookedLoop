import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { canAccess } from "@/lib/auth/roles";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import type { Role } from "@/lib/auth/roles";

function toRole(value: unknown): Role {
  return value === "admin" || value === "manager" || value === "caller" ? value : "caller";
}

function authDebugEnabled() {
  return process.env.BL_DEBUG_AUTH === "1";
}

export async function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const res = NextResponse.next();

  const host = req.headers.get("host") ?? "";
  if (host.startsWith("www.bookedloop.com")) {
    url.host = "bookedloop.com";
    url.protocol = "https:";
    return NextResponse.redirect(url);
  }

  const isAdminPath = url.pathname.startsWith("/admin");
  const isLogin = url.pathname === "/admin/login";
  const isLogout = url.pathname === "/admin/logout";

  if (isAdminPath) {
    const isProd = process.env.NODE_ENV === "production";
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      if (authDebugEnabled()) {
        console.log("[auth-debug] middleware missing env", {
          host: req.headers.get("host"),
          path: url.pathname,
          hasSupabaseUrl: Boolean(supabaseUrl),
          hasAnonKey: Boolean(supabaseKey),
        });
      }
      if (isLogin || isLogout) return res;
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return req.cookies.getAll().map(({ name, value }) => ({ name, value }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            const domain =
              isProd && host.endsWith("bookedloop.com") ? ".bookedloop.com" : options?.domain;
            if (domain === ".bookedloop.com") {
              res.cookies.set(name, "", { path: options?.path ?? "/", maxAge: 0 });
            }
            res.cookies.set(name, value, {
              ...options,
              domain,
              path: options?.path ?? "/",
              sameSite: options?.sameSite ?? "lax",
              secure: options?.secure ?? isProd,
            });
          });
        },
      },
    });

    try {
      const cookieNames = req.cookies.getAll().map((c) => c.name);
      const hasSupabaseCookie = cookieNames.some((n) => n.startsWith("sb-"));

      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      const finalUser = sessionData.session?.user ?? null;

      if (authDebugEnabled()) {
        console.log("[auth-debug] middleware", {
          host: req.headers.get("host"),
          path: url.pathname,
          method: req.method,
          referer: req.headers.get("referer"),
          isProd,
          isLogin,
          isLogout,
          cookieCount: cookieNames.length,
          hasSupabaseCookie,
          cookieNames: cookieNames.filter((n) => n.startsWith("sb-")),
          getSession: { ok: Boolean(finalUser), err: sessionErr ? sessionErr.message : null },
        });
        res.headers.set(
          "x-auth-debug",
          JSON.stringify({
            p: url.pathname,
            sb: hasSupabaseCookie ? 1 : 0,
            s: finalUser ? 1 : 0,
            e: sessionErr ? 1 : 0,
          })
        );
      }

      if (!finalUser && !isLogin) {
        if (authDebugEnabled()) {
          console.log("[auth-debug] redirect -> /admin/login (no user)", { path: url.pathname });
        }
        return NextResponse.redirect(new URL("/admin/login", req.url));
      }
      if (finalUser && isLogin) {
        if (authDebugEnabled()) {
          console.log("[auth-debug] redirect -> /admin (already authed)", { path: url.pathname });
        }
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      if (finalUser && !isLogin && !isLogout) {
        const role = toRole(finalUser.app_metadata?.role);
        if (!canAccess(url.pathname, role)) {
          if (authDebugEnabled()) {
            console.log("[auth-debug] redirect -> /admin (rbac deny)", { path: url.pathname, role });
          }
          return NextResponse.redirect(new URL("/admin", req.url));
        }
      }
    } catch (err) {
      if (authDebugEnabled()) {
        console.log("[auth-debug] middleware exception", {
          host: req.headers.get("host"),
          path: url.pathname,
          method: req.method,
          message: err instanceof Error ? err.message : String(err),
        });
      }
      if (isLogin || isLogout) return res;
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
