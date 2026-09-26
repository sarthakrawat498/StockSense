import { NextRequest, NextResponse } from "next/server";

import { verifyToken, ACCESS_TOKEN_COOKIE } from "@/lib/auth/jwt";
import { ROUTES } from "@/constants/routes";

const PUBLIC_PATHS = [
  ROUTES.LOGIN,
  ROUTES.SIGNUP,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
];

const PUBLIC_API_PATHS = [
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/logout",
  "/api/auth/refresh",
  "/api/auth/reset-password",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow Next.js internals
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const isAuthenticated = token
    ? await verifyToken(token, "access").catch(() => null)
    : null;

  const isPublicPage = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isPublicApi  = PUBLIC_API_PATHS.some((p) => pathname.startsWith(p));
  const isApiPath    = pathname.startsWith("/api/");

  // Redirect logged-in users away from auth pages
  if (isPublicPage && isAuthenticated) {
    return NextResponse.redirect(new URL(ROUTES.DASHBOARD, request.url));
  }

  // Protect app pages
  if (!isPublicPage && !isApiPath && !isAuthenticated) {
    const loginUrl = new URL(ROUTES.LOGIN, request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Protect API routes
  if (isApiPath && !isPublicApi && !isAuthenticated) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
