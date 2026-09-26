import { prisma } from "@/lib/db";

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
  });
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
}

export async function findUserByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username },
  });
}

export async function findUserByIdentifier(identifier: string) {
  const normalized = identifier.trim();
  return prisma.user.findFirst({
    where: {
      OR: [
        { email: normalized.toLowerCase() },
        { username: normalized },
      ],
    },
  });
}

export async function countUsers(): Promise<number> {
  return prisma.user.count();
}

/**
 * Retrieve the latest unused and non-expired OTP for a user.
 */
export async function findLatestActiveOtp(userId: string) {
  return prisma.passwordResetOtp.findFirst({
    where: {
      userId,
      usedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
