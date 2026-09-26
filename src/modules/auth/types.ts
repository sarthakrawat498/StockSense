import type { Timestamps } from "@/types/common.types";
import type { UserRole } from "@/types/common.types";

// ─── Domain Types ─────────────────────────────────────────────────────────────

export interface User extends Timestamps {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
}

// ─── Request / Response DTOs ──────────────────────────────────────────────────

export interface SignupParams {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

export interface LoginParams {
  email: string;
  password: string;
}

export interface ResetPasswordRequestParams {
  email: string;
}

export interface ResetPasswordConfirmParams {
  token: string;
  newPassword: string;
}

export interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}
