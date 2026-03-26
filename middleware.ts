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
            res.cookies.set(name, value, {
              ...options,
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

      const { data: userData, error: userErr } = await supabase.auth.getUser();
      const user = userData.user ?? null;

      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      const sessionUser = sessionData.session?.user ?? null;

      const finalUser = user ?? sessionUser;

      if (authDebugEnabled()) {
        console.log("[auth-debug] middleware", {
          host: req.headers.get("host"),
          path: url.pathname,
          isProd,
          isLogin,
          isLogout,
          cookieCount: cookieNames.length,
          hasSupabaseCookie,
          getUser: { ok: Boolean(user), err: userErr ? userErr.message : null },
          getSession: { ok: Boolean(sessionUser), err: sessionErr ? sessionErr.message : null },
        });
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
