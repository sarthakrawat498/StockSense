import { NextRequest } from "next/server";
import { POST as signupHandler } from "@/app/api/auth/signup/route";
import { POST as loginHandler } from "@/app/api/auth/login/route";
import { POST as logoutHandler } from "@/app/api/auth/logout/route";
import { authService } from "@/modules/auth";

jest.mock("@/modules/auth", () => ({
  authService: {
    signup: jest.fn(),
    login: jest.fn(),
  },
}));

describe("Auth API Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/auth/signup", () => {
    it("returns 201 with set-cookie on valid signup", async () => {
      (authService.signup as jest.Mock).mockResolvedValue({
        user: {
          id: "uuid-1",
          username: "manager1",
          email: "manager@test.com",
          role: "MANAGER",
          warehouseId: null,
        },
        tokens: {
          accessToken: "mock.access.token",
          refreshToken: "mock.refresh.token",
        },
      });

      const req = new NextRequest("http://localhost:3000/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          username: "manager1",
          email: "manager@test.com",
          password: "securepassword",
          role: "MANAGER",
        }),
      });

      const response = await signupHandler(req);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data.username).toBe("manager1");
      expect(response.cookies.get("access_token")).toBeDefined();
      expect(response.cookies.get("refresh_token")).toBeDefined();
    });

    it("returns 422 validation error on bad input", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          username: "u", // too short
          email: "invalid-email",
          password: "123", // too short
        }),
      });

      const response = await signupHandler(req);
      const json = await response.json();

      expect(response.status).toBe(422);
      expect(json.success).toBe(false);
      expect(json.errors).toBeDefined();
      expect(json.errors.length).toBeGreaterThan(0);
    });
  });

  describe("POST /api/auth/login", () => {
    it("returns 200 with cookies on successful login", async () => {
      (authService.login as jest.Mock).mockResolvedValue({
        user: {
          id: "uuid-1",
          username: "manager1",
          email: "manager@test.com",
          role: "MANAGER",
          warehouseId: null,
        },
        tokens: {
          accessToken: "mock.access.token",
          refreshToken: "mock.refresh.token",
        },
      });

      const req = new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          identifier: "manager1",
          password: "securepassword",
        }),
      });

      const response = await loginHandler(req);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.email).toBe("manager@test.com");
      expect(response.cookies.get("access_token")).toBeDefined();
    });
  });

  describe("POST /api/auth/logout", () => {
    it("clears auth cookies", async () => {
      const response = await logoutHandler();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(response.cookies.get("access_token")?.value).toBe("");
      expect(response.cookies.get("refresh_token")?.value).toBe("");
    });
  });
});
