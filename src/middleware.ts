import { NextRequest, NextResponse } from "next/server";

// TODO: Replace with real auth check once JWT helpers are implemented
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
