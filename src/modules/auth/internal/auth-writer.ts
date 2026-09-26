import { prisma } from "@/lib/db";
import type { UserRole } from "@/types/common.types";

export interface CreateUserData {
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  warehouseId?: string | null;
}

export async function createUser(data: CreateUserData) {
  return prisma.user.create({
    data: {
      username: data.username,
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      role: data.role,
      warehouseId: data.warehouseId ?? null,
    },
  });
}

/**
 * Invalidate prior OTPs and create a new active password reset OTP.
 */
export async function createPasswordResetOtp(
  userId: string,
  codeHash: string,
  expiresAt: Date
) {
  return prisma.$transaction(async (tx) => {
    // Invalidate existing unused tokens for this user
    await tx.passwordResetOtp.updateMany({
      where: {
        userId,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    // Create the new OTP
    return tx.passwordResetOtp.create({
      data: {
        userId,
        codeHash,
        expiresAt,
      },
    });
  });
}

/**
 * Reset password and mark OTP as used atomically.
 */
export async function resetPasswordWithOtp(
  userId: string,
  otpId: string,
  newPasswordHash: string
) {
  return prisma.$transaction(async (tx) => {
    // Mark OTP as used
    await tx.passwordResetOtp.update({
      where: { id: otpId },
      data: { usedAt: new Date() },
    });

    // Update user's password
    return tx.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });
  });
}
