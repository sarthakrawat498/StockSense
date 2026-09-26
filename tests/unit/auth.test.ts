import { hashPassword, comparePassword } from "@/modules/auth/internal/auth-util";
import { generateTokenPair, verifyToken } from "@/lib/auth/jwt";
import { signupSchema, loginSchema } from "@/features/auth/schemas";
import { authService } from "@/modules/auth/auth-service";
import { prisma } from "@/lib/db";
import { ConflictError, UnauthorizedError } from "@/lib/errors";

// Mock Prisma client singleton
jest.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe("Auth Utilities & JWT", () => {
  it("should hash and verify passwords correctly", async () => {
    const raw = "SuperSecret123!";
    const hashed = await hashPassword(raw);

    expect(hashed).not.toBe(raw);
    expect(await comparePassword(raw, hashed)).toBe(true);
    expect(await comparePassword("WrongPassword", hashed)).toBe(false);
  });

  it("should sign and verify access and refresh tokens", async () => {
    const user = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      username: "testmanager",
      email: "manager@example.com",
      role: "MANAGER" as const,
      warehouseId: null,
    };

    const tokens = await generateTokenPair(user);

    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();

    const accessPayload = await verifyToken(tokens.accessToken, "access");
    expect(accessPayload.sub).toBe(user.id);
    expect(accessPayload.username).toBe(user.username);
    expect(accessPayload.role).toBe("MANAGER");
    expect(accessPayload.type).toBe("access");

    const refreshPayload = await verifyToken(tokens.refreshToken, "refresh");
    expect(refreshPayload.sub).toBe(user.id);
    expect(refreshPayload.type).toBe("refresh");
  });
});

describe("Auth Schemas Validation", () => {
  it("validates correct signup input", () => {
    const valid = {
      username: "john_doe",
      email: "john@example.com",
      password: "password123",
      role: "STAFF",
    };

    const parsed = signupSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid usernames", () => {
    const invalid = {
      username: "jo", // too short
      email: "john@example.com",
      password: "password123",
    };

    const parsed = signupSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it("validates login input", () => {
    const valid = {
      identifier: "john_doe",
      password: "password123",
    };

    const parsed = loginSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });
});

describe("Auth Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("registers first user as MANAGER by default", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.count as jest.Mock).mockResolvedValue(0);

    const mockCreated = {
      id: "uuid-1",
      username: "firstuser",
      email: "first@example.com",
      passwordHash: "hashed",
      role: "MANAGER" as const,
      warehouseId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    (prisma.user.create as jest.Mock).mockResolvedValue(mockCreated);

    const result = await authService.signup({
      username: "firstuser",
      email: "first@example.com",
      password: "password123",
    });

    expect(result.user.role).toBe("MANAGER");
    expect(result.user.username).toBe("firstuser");
    expect(result.tokens.accessToken).toBeDefined();
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          role: "MANAGER",
          email: "first@example.com",
          username: "firstuser",
        }),
      })
    );
  });

  it("prevents duplicate email registration", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "uuid-existing",
      username: "someone",
      email: "existing@example.com",
      passwordHash: "hash",
      role: "STAFF",
      warehouseId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      authService.signup({
        username: "newuser",
        email: "existing@example.com",
        password: "password123",
      })
    ).rejects.toThrow(ConflictError);
  });

  it("authenticates valid credentials on login", async () => {
    const rawPass = "validPassword123";
    const hashed = await hashPassword(rawPass);

    (prisma.user.findFirst as jest.Mock).mockResolvedValue({
      id: "uuid-user",
      username: "validuser",
      email: "valid@example.com",
      passwordHash: hashed,
      role: "STAFF",
      warehouseId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await authService.login({
      identifier: "validuser",
      password: rawPass,
    });

    expect(result.user.username).toBe("validuser");
    expect(result.tokens.accessToken).toBeDefined();
  });

  it("rejects invalid password on login", async () => {
    const hashed = await hashPassword("correctPassword");

    (prisma.user.findFirst as jest.Mock).mockResolvedValue({
      id: "uuid-user",
      username: "validuser",
      email: "valid@example.com",
      passwordHash: hashed,
      role: "STAFF",
      warehouseId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      authService.login({
        identifier: "validuser",
        password: "wrongPassword",
      })
    ).rejects.toThrow(UnauthorizedError);
  });
});
