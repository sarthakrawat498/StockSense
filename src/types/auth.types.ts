import type { UserRole } from "./common.types";

/**
 * Auth-related types shared between FE and BE boundary.
 */
export interface AuthUser {
  id: string;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  warehouseId: string | null;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string; // userId
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  warehouseId?: string | null;
  type: "access" | "refresh";
  iat?: number;
  exp?: number;
}
