import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

import type { AuthUser } from "@/types/auth.types";

import { ACCESS_TOKEN_COOKIE, verifyToken } from "./jwt";

/**
 * Retrieve the current authenticated user from request cookies (used in Route Handlers & Server Components).
 */
export async function getSessionUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

    if (!token) {
      return null;
    }

    const payload = await verifyToken(token, "access");
    return {
      id: payload.sub,
      username: payload.username,
      email: payload.email,
      role: payload.role,
      warehouseId: payload.warehouseId ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Retrieve the authenticated user from a NextRequest object (used in Next.js middleware).
 */
export async function getSessionUserFromRequest(
  req: NextRequest
): Promise<AuthUser | null> {
  try {
    const token =
      req.cookies.get(ACCESS_TOKEN_COOKIE)?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return null;
    }

    const payload = await verifyToken(token, "access");
    return {
      id: payload.sub,
      username: payload.username,
      email: payload.email,
      role: payload.role,
      warehouseId: payload.warehouseId ?? null,
    };
  } catch {
    return null;
  }
}
