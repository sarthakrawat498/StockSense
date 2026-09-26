import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

import { ROUTES } from "@/constants/routes";
import { ACCESS_TOKEN_COOKIE, verifyToken } from "@/lib/auth/jwt";

const AUTH_PAGES = [
  ROUTES.LOGIN,
  ROUTES.SIGNUP,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Let API and internal/static assets pass through
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  let isAuthenticated = false;

  if (token) {
    try {
      await verifyToken(token, "access");
      isAuthenticated = true;
    } catch {
      isAuthenticated = false;
    }
  }

  const isAuthPage = AUTH_PAGES.some((page) => pathname.startsWith(page));

  // If already authenticated and trying to access login/signup pages, redirect to dashboard
  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL(ROUTES.DASHBOARD, req.url));
  }

  // If unauthenticated and trying to access a protected page, redirect to login
  if (!isAuthPage && !isAuthenticated) {
    const loginUrl = new URL(ROUTES.LOGIN, req.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("callbackUrl", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Root "/" redirect
  if (pathname === "/") {
    const destination = isAuthenticated ? ROUTES.DASHBOARD : ROUTES.LOGIN;
    return NextResponse.redirect(new URL(destination, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
