import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/auth-helpers-nextjs";

import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const debug = process.env.BL_DEBUG_AUTH === "1";
  const jar = await cookies();
  const host = (await headers()).get("host") ?? "";
  const isProd = process.env.NODE_ENV === "production";
  const domain = isProd && host.endsWith("bookedloop.com") ? ".bookedloop.com" : undefined;

  const formData = await req.formData();
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");

  if (!username || !password) {
    return NextResponse.redirect(new URL("/admin/login?error=invalid_login", req.url));
  }

  const admin = supabaseServer();
  const { data: profile } = await admin
    .from("users")
    .select("email, role, is_active")
    .eq("username", username)
    .maybeSingle();

  if (!profile || profile.is_active === false) {
    return NextResponse.redirect(new URL("/admin/login?error=invalid_login", req.url));
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.redirect(new URL("/admin/login?error=invalid_login", req.url));
  }

  const res = NextResponse.redirect(new URL("/admin?toast=login", req.url));

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return jar.getAll().map(({ name, value }) => ({ name, value }));
      },
      setAll(cookiesToSet) {
        if (debug) {
          console.log("[auth-debug] login(route) setAll", {
            host,
            domain,
            cookieNames: cookiesToSet.map((c) => c.name),
            cookieCount: cookiesToSet.length,
          });
        }
        cookiesToSet.forEach(({ name, value, options }) => {
          if (domain) {
            res.cookies.set(name, "", { path: options?.path ?? "/", maxAge: 0 });
          }
          res.cookies.set(name, value, {
            ...options,
            domain: domain ?? options?.domain,
            path: options?.path ?? "/",
            sameSite: options?.sameSite ?? "lax",
            secure: options?.secure ?? isProd,
          });
        });
      },
    },
  });

  const { data, error } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password,
  });

  if (debug) {
    console.log("[auth-debug] login(route) signIn result", { ok: Boolean(data.session), hasError: Boolean(error) });
  }

  if (error || !data.session) {
    return NextResponse.redirect(new URL("/admin/login?error=invalid_login", req.url));
  }

  const role = (data.user?.app_metadata?.role as string | undefined) ?? profile.role;
  if (role === "caller") {
    return NextResponse.redirect(new URL("/admin/calls?toast=login", req.url), { headers: res.headers });
  }

  return res;
}
