import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = await cookies();
  const response = NextResponse.json({ success: true }, { status: 200 });

  // Log all cookies before signout
  const allCookies = cookieStore.getAll();
  console.log("[SignOut] Cookies BEFORE signout:", allCookies.map(c => `${c.name}=${c.value.substring(0, 20)}...`));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          console.log("[SignOut] setAll called with cookies:", cookiesToSet.map(c => `${c.name}=${c.value.substring(0, 20)}... opts=${JSON.stringify(c.options)}`));
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.signOut();
  console.log("[SignOut] signOut result error:", error);

  // Fallback: manually clear any remaining Supabase auth cookies
  allCookies.forEach(({ name }) => {
    if (name.startsWith("sb-")) {
      console.log("[SignOut] Force-clearing cookie:", name);
      response.cookies.set(name, "", {
        path: "/",
        expires: new Date(0),
        maxAge: 0,
      });
    }
  });

  // Log final response cookies
  const responseCookies = response.cookies.getAll();
  console.log("[SignOut] Response cookies being sent:", responseCookies.map(c => `${c.name}=${c.value.substring(0, 20)}...`));

  return response;
}

