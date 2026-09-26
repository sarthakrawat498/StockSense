/**
 * Auth-related types shared between FE and BE boundary.
 */
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: import("./common.types").UserRole;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;       // userId
  email: string;
  role: string;
  iat: number;
  exp: number;
}
