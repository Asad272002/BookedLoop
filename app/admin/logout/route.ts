import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(req: Request) {
  const jar = await cookies();
  const host = (await headers()).get("host") ?? "";
  const domain =
    process.env.NODE_ENV === "production" && host.endsWith("bookedloop.com")
      ? ".bookedloop.com"
      : undefined;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return jar.getAll().map(({ name, value }) => ({ name, value }));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          jar.set(name, value, {
            ...options,
            domain: domain ?? options?.domain,
            path: options?.path ?? "/",
            sameSite: options?.sameSite ?? "lax",
            secure: options?.secure ?? process.env.NODE_ENV === "production",
          });
        });
      },
    },
  });

  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/admin/login", req.url));
}
