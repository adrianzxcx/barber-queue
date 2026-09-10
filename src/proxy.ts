import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getRoleDashboard, getRoleFromAccessToken } from "@/lib/auth/roles";

function redirectWithCookies(request: NextRequest, response: NextResponse, path: string) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = path;
  redirectUrl.search = "";

  const redirectResponse = NextResponse.redirect(redirectUrl);
  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith("/auth");
  const isUserRoute = pathname.startsWith("/user");
  const isAdminRoute = pathname.startsWith("/admin");

  if (!user && (isUserRoute || isAdminRoute)) {
    return redirectWithCookies(request, response, "/auth/login");
  }

  if (user) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const role = user.app_metadata.app_role ?? getRoleFromAccessToken(session?.access_token);

    const isUpdatePasswordRoute = pathname === "/auth/update-password";
    const isAuthConfirmRoute = pathname.startsWith("/auth/confirm");

    if (pathname === "/") {
      return redirectWithCookies(request, response, getRoleDashboard(role));
    }

    if (isAuthRoute && !isUpdatePasswordRoute && !isAuthConfirmRoute) {
      return redirectWithCookies(request, response, getRoleDashboard(role));
    }

    if (isAdminRoute && role !== "receptionist") {
      return redirectWithCookies(request, response, "/user/dashboard");
    }

    if (isUserRoute && role === "receptionist") {
      return redirectWithCookies(request, response, "/admin/dashboard");
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
