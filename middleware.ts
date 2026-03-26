import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { canAccess } from "@/lib/auth/roles";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import type { Role } from "@/lib/auth/roles";

function toRole(value: unknown): Role {
  return value === "admin" || value === "manager" || value === "caller" ? value : "caller";
}

export async function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const res = NextResponse.next();

  const isAdminPath = url.pathname.startsWith("/admin");
  const isLogin = url.pathname === "/admin/login";
  const isLogout = url.pathname === "/admin/logout";

  if (isAdminPath) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
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
            res.cookies.set(name, value, options);
          });
        },
      },
    });

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

    if (!user && !isLogin) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    if (user && isLogin) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    if (user && !isLogin && !isLogout) {
      const role = toRole(user.app_metadata?.role);
      if (!canAccess(url.pathname, role)) {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
    }
    } catch {
      if (isLogin || isLogout) return res;
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
