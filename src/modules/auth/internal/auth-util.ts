import crypto from "crypto";

import bcrypt from "bcryptjs";

import type { AuthUser } from "@/types/auth.types";
import type { UserRole } from "@/types/common.types";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a cryptographically secure 6-digit numeric OTP code.
 */
export function generateOtp(): string {
  const buffer = crypto.randomBytes(4);
  const num = buffer.readUInt32BE(0) % 900000 + 100000;
  return num.toString();
}

export async function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10);
}

export async function compareOtp(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}

export function sanitizeUser(user: {
  id: string;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  warehouseId: string | null;
}): AuthUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    warehouseId: user.warehouseId,
  };
}
