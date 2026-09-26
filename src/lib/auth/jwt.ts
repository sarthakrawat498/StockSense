import type { NextResponse } from "next/server";

import { SignJWT, jwtVerify } from "jose";

import type { JwtPayload, TokenPair } from "@/types/auth.types";
import type { UserRole } from "@/types/common.types";

const DEFAULT_SECRET = "stocksense-super-secret-jwt-key-min-32-chars-for-dev";
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || DEFAULT_SECRET);

export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";

export const ACCESS_TOKEN_MAX_AGE = 15 * 60; // 15 minutes (seconds)
export const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days (seconds)

/**
 * Sign an Access Token (15 min).
 */
export async function signAccessToken(
  payload: Omit<JwtPayload, "type" | "iat" | "exp">
): Promise<string> {
  return new SignJWT({ ...payload, type: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_ACCESS_EXPIRY || "15m")
    .sign(JWT_SECRET);
}

/**
 * Sign a Refresh Token (7 days).
 */
export async function signRefreshToken(
  payload: Pick<JwtPayload, "sub" | "username" | "email" | "role" | "warehouseId">
): Promise<string> {
  return new SignJWT({ ...payload, type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_REFRESH_EXPIRY || "7d")
    .sign(JWT_SECRET);
}

/**
 * Generate both Access Token and Refresh Token.
 */
export async function generateTokenPair(user: {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  warehouseId?: string | null;
}): Promise<TokenPair> {
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken({
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      warehouseId: user.warehouseId ?? null,
    }),
    signRefreshToken({
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      warehouseId: user.warehouseId ?? null,
    }),
  ]);

  return { accessToken, refreshToken };
}

/**
 * Verify a JWT and validate expected token type.
 */
export async function verifyToken(
  token: string,
  expectedType?: "access" | "refresh"
): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET);

  const jwtPayload = {
    sub: payload.sub as string,
    username: payload.username as string,
    email: payload.email as string,
    role: payload.role as UserRole,
    warehouseId: (payload.warehouseId as string | null) ?? null,
    type: payload.type as "access" | "refresh",
    iat: payload.iat,
    exp: payload.exp,
  };

  if (expectedType && jwtPayload.type !== expectedType) {
    throw new Error(`Invalid token type: expected ${expectedType}, received ${jwtPayload.type}`);
  }

  return jwtPayload;
}

/**
 * Attach secure auth cookies to a NextResponse.
 */
export function setAuthCookies(res: NextResponse, tokens: TokenPair): void {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookies.set({
    name: ACCESS_TOKEN_COOKIE,
    value: tokens.accessToken,
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });

  res.cookies.set({
    name: REFRESH_TOKEN_COOKIE,
    value: tokens.refreshToken,
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
}

/**
 * Clear auth cookies from a NextResponse (for logout).
 */
export function clearAuthCookies(res: NextResponse): void {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookies.set({
    name: ACCESS_TOKEN_COOKIE,
    value: "",
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  res.cookies.set({
    name: REFRESH_TOKEN_COOKIE,
    value: "",
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
