import { API } from "@/constants/api-endpoints";
import type { ApiResponse } from "@/types/api.types";
import type { AuthUser } from "@/types/auth.types";

import type {
  LoginFormValues,
  SignupFormValues,
  ForgotPasswordFormValues,
} from "../schemas/auth.schema";

export interface ConfirmResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(endpoint, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const json: ApiResponse<T> = await res.json();

  if (!res.ok || !json.success) {
    const errorMsg =
      json.errors?.[0]?.message || json.message || "Request failed. Please try again.";
    throw new Error(errorMsg);
  }

  return json.data as T;
}

export const authClient = {
  /**
   * Log in user with username and password.
   */
  async login(values: LoginFormValues): Promise<AuthUser> {
    return request<AuthUser>(API.AUTH.LOGIN, {
      method: "POST",
      body: JSON.stringify({
        identifier: values.username,
        password: values.password,
      }),
    });
  },

  /**
   * Register a new user account.
   */
  async signup(values: Omit<SignupFormValues, "confirmPassword">): Promise<AuthUser> {
    return request<AuthUser>(API.AUTH.SIGNUP, {
      method: "POST",
      body: JSON.stringify({
        username: values.username,
        email: values.email,
        password: values.password,
      }),
    });
  },

  /**
   * Log out user and clear auth cookies.
   */
  async logout(): Promise<void> {
    await request<null>(API.AUTH.LOGOUT, {
      method: "POST",
    });
  },

  /**
   * Send a password reset OTP to user email.
   */
  async forgotPassword(values: ForgotPasswordFormValues): Promise<string> {
    const res = await fetch(API.AUTH.RESET_PASSWORD_REQUEST, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const json: ApiResponse<null> = await res.json();
    return json.message || "If an account exists, a reset code has been sent.";
  },

  /**
   * Confirm password reset using OTP code.
   */
  async resetPassword(payload: ConfirmResetPasswordPayload): Promise<string> {
    const res = await fetch(API.AUTH.RESET_PASSWORD_CONFIRM, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json: ApiResponse<null> = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.errors?.[0]?.message || json.message || "Failed to reset password.");
    }

    return json.message || "Password reset successfully.";
  },

  /**
   * Fetch current authenticated user.
   */
  async getMe(): Promise<AuthUser | null> {
    try {
      return await request<AuthUser>(API.USERS.ME, {
        method: "GET",
      });
    } catch {
      return null;
    }
  },
};
