import { NextRequest } from "next/server";
import { POST as requestHandler } from "@/app/api/auth/reset-password/request/route";
import { POST as confirmHandler } from "@/app/api/auth/reset-password/confirm/route";
import { authService } from "@/modules/auth/auth-service";
import { prisma } from "@/lib/db";
import { emailService } from "@/lib/email";
import { hashOtp } from "@/modules/auth/internal/auth-util";
import { BadRequestError } from "@/lib/errors";

jest.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    passwordResetOtp: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(prisma)),
  },
}));

jest.mock("@/lib/email", () => ({
  emailService: {
    sendPasswordResetOtp: jest.fn().mockResolvedValue(true),
  },
}));

describe("OTP Password Reset Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("requestPasswordReset", () => {
    it("generates OTP, stores record, and sends email for valid user", async () => {
      const mockUser = {
        id: "uuid-1",
        username: "testuser",
        email: "user@test.com",
        passwordHash: "hash123",
        role: "STAFF" as const,
        warehouseId: null,
      };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.passwordResetOtp.create as jest.Mock).mockResolvedValue({ id: "otp-1" });

      const result = await authService.requestPasswordReset({ email: "user@test.com" });

      expect(result.message).toContain("If an account with this email exists");
      expect(prisma.passwordResetOtp.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: mockUser.id,
            codeHash: expect.any(String),
            expiresAt: expect.any(Date),
          }),
        })
      );
      expect(emailService.sendPasswordResetOtp).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "user@test.com",
          username: "testuser",
          otp: expect.stringMatching(/^\d{6}$/),
        })
      );
    });

    it("returns generic success message even if user does not exist", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await authService.requestPasswordReset({ email: "nonexistent@test.com" });

      expect(result.message).toContain("If an account with this email exists");
      expect(prisma.passwordResetOtp.create).not.toHaveBeenCalled();
      expect(emailService.sendPasswordResetOtp).not.toHaveBeenCalled();
    });
  });

  describe("confirmPasswordReset", () => {
    it("successfully resets password when OTP is valid", async () => {
      const mockUser = {
        id: "uuid-1",
        username: "testuser",
        email: "user@test.com",
        passwordHash: "oldhash",
        role: "STAFF" as const,
        warehouseId: null,
      };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const otpCode = "654321";
      const codeHash = await hashOtp(otpCode);

      (prisma.passwordResetOtp.findFirst as jest.Mock).mockResolvedValue({
        id: "otp-uuid-1",
        userId: mockUser.id,
        codeHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        usedAt: null,
      });

      const result = await authService.confirmPasswordReset({
        email: "user@test.com",
        otp: otpCode,
        newPassword: "BrandNewPassword123",
      });

      expect(result.message).toContain("successfully reset");
      expect(prisma.passwordResetOtp.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "otp-uuid-1" },
          data: expect.objectContaining({ usedAt: expect.any(Date) }),
        })
      );
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUser.id },
          data: expect.objectContaining({ passwordHash: expect.any(String) }),
        })
      );
    });

    it("rejects password reset with incorrect OTP code", async () => {
      const mockUser = {
        id: "uuid-1",
        username: "testuser",
        email: "user@test.com",
        passwordHash: "oldhash",
        role: "STAFF" as const,
        warehouseId: null,
      };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const realOtp = "111111";
      const codeHash = await hashOtp(realOtp);

      (prisma.passwordResetOtp.findFirst as jest.Mock).mockResolvedValue({
        id: "otp-uuid-1",
        userId: mockUser.id,
        codeHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        usedAt: null,
      });

      await expect(
        authService.confirmPasswordReset({
          email: "user@test.com",
          otp: "999999", // wrong code
          newPassword: "BrandNewPassword123",
        })
      ).rejects.toThrow(BadRequestError);
    });

    it("rejects password reset when no active OTP is found", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "uuid-1",
        email: "user@test.com",
      });
      (prisma.passwordResetOtp.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.confirmPasswordReset({
          email: "user@test.com",
          otp: "123456",
          newPassword: "BrandNewPassword123",
        })
      ).rejects.toThrow(BadRequestError);
    });
  });
});

describe("OTP Reset Password Routes", () => {
  it("POST /api/auth/reset-password/request returns 200 on valid email", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/reset-password/request", {
      method: "POST",
      body: JSON.stringify({ email: "test@example.com" }),
    });

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await requestHandler(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.message).toContain("If an account with this email exists");
  });

  it("POST /api/auth/reset-password/confirm validates 6-digit OTP", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/reset-password/confirm", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        otp: "123", // invalid length (not 6 digits)
        newPassword: "password123",
      }),
    });

    const res = await confirmHandler(req);
    const json = await res.json();

    expect(res.status).toBe(422);
    expect(json.success).toBe(false);
    expect(json.errors[0].field).toBe("otp");
  });
});
