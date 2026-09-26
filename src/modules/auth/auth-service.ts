import { generateTokenPair, verifyToken } from "@/lib/auth/jwt";
import { emailService } from "@/lib/email";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "@/lib/errors";
import type { AuthUser, TokenPair } from "@/types/auth.types";
import type { UserRole } from "@/types/common.types";

import {
  countUsers,
  findLatestActiveOtp,
  findUserByEmail,
  findUserById,
  findUserByIdentifier,
  findUserByUsername,
} from "./internal/auth-reader";
import {
  compareOtp,
  comparePassword,
  generateOtp,
  hashOtp,
  hashPassword,
  sanitizeUser,
} from "./internal/auth-util";
import {
  createPasswordResetOtp,
  createUser,
  resetPasswordWithOtp,
} from "./internal/auth-writer";

import type {
  AuthResult,
  LoginParams,
  ResetPasswordConfirmParams,
  ResetPasswordRequestParams,
  SignupParams,
} from "./types";

export const authService = {
  /**
   * Register a new user account.
   */
  async signup(params: SignupParams): Promise<AuthResult> {
    const email = params.email.toLowerCase().trim();
    const username = params.username.trim();

    // Check for existing email
    const existingEmail = await findUserByEmail(email);
    if (existingEmail) {
      throw new ConflictError("An account with this email already exists.");
    }

    // Check for existing username
    const existingUsername = await findUserByUsername(username);
    if (existingUsername) {
      throw new ConflictError("This username is already taken.");
    }

    // Determine initial role: if specified use it; otherwise, the first user in the system is MANAGER
    let role: UserRole = params.role || "STAFF";
    if (!params.role) {
      const totalUsers = await countUsers();
      if (totalUsers === 0) {
        role = "MANAGER";
      }
    }

    const passwordHash = await hashPassword(params.password);

    const newUser = await createUser({
      username,
      email,
      passwordHash,
      role,
      warehouseId: params.warehouseId ?? null,
    });

    const user: AuthUser = sanitizeUser(newUser);
    const tokens = await generateTokenPair(user);

    return { user, tokens };
  },

  /**
   * Authenticate a user by username or email and password.
   */
  async login(params: LoginParams): Promise<AuthResult> {
    const user = await findUserByIdentifier(params.identifier);

    if (!user) {
      throw new UnauthorizedError("Invalid email/username or password.");
    }

    const isValidPassword = await comparePassword(params.password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedError("Invalid email/username or password.");
    }

    const sanitizedUser: AuthUser = sanitizeUser(user);
    const tokens = await generateTokenPair(sanitizedUser);

    return { user: sanitizedUser, tokens };
  },

  /**
   * Issue new token pair using a valid refresh token.
   */
  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    let payload;
    try {
      payload = await verifyToken(refreshToken, "refresh");
    } catch {
      throw new UnauthorizedError("Invalid or expired refresh token.");
    }

    const user = await findUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedError("User associated with token no longer exists.");
    }

    return generateTokenPair(sanitizeUser(user));
  },

  /**
   * Get user profile details by ID.
   */
  async getCurrentUser(userId: string): Promise<AuthUser> {
    const user = await findUserById(userId);

    if (!user) {
      throw new NotFoundError("User not found.");
    }

    return sanitizeUser(user);
  },

  /**
   * Initiate an OTP password reset flow.
   * Generates a 6-digit OTP, stores its hash with expiry, and emails the code.
   */
  async requestPasswordReset(params: ResetPasswordRequestParams): Promise<{ message: string }> {
    const email = params.email.toLowerCase().trim();
    const user = await findUserByEmail(email);

    // Return uniform message regardless of email existence to prevent account enumeration
    const genericResponse = {
      message: "If an account with this email exists, a password reset code has been sent.",
    };

    if (!user) {
      return genericResponse;
    }

    const otp = generateOtp();
    const codeHash = await hashOtp(otp);
    const expiryMinutes = Number(process.env.OTP_EXPIRY_MINUTES) || 10;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    await createPasswordResetOtp(user.id, codeHash, expiresAt);

    await emailService.sendPasswordResetOtp({
      to: user.email,
      otp,
      username: user.username,
      expiryMinutes,
    });

    return genericResponse;
  },

  /**
   * Complete password reset using an active OTP code.
   */
  async confirmPasswordReset(params: ResetPasswordConfirmParams): Promise<{ message: string }> {
    const email = params.email.toLowerCase().trim();
    const user = await findUserByEmail(email);

    if (!user) {
      throw new BadRequestError("Invalid or expired reset code.");
    }

    const activeOtp = await findLatestActiveOtp(user.id);
    if (!activeOtp) {
      throw new BadRequestError("Invalid or expired reset code.");
    }

    const isMatch = await compareOtp(params.otp.trim(), activeOtp.codeHash);
    if (!isMatch) {
      throw new BadRequestError("Invalid or expired reset code.");
    }

    const newPasswordHash = await hashPassword(params.newPassword);
    await resetPasswordWithOtp(user.id, activeOtp.id, newPasswordHash);

    return {
      message: "Your password has been successfully reset. You can now log in with your new password.",
    };
  },
};
