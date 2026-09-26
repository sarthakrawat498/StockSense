import type { AuthUser, TokenPair } from "@/types/auth.types";
import type { UserRole } from "@/types/common.types";

// ─── Request / Response DTOs ──────────────────────────────────────────────────

export interface SignupParams {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
  warehouseId?: string | null;
}

export interface LoginParams {
  identifier: string; // username or email
  password: string;
}

export interface AuthResult {
  user: AuthUser;
  tokens: TokenPair;
}

export interface ResetPasswordRequestParams {
  email: string;
}

export interface ResetPasswordConfirmParams {
  email: string;
  otp: string;
  newPassword: string;
}
