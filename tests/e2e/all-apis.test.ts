import { prisma } from "@/lib/db";
import { createJsonRequest, routeContext } from "../helpers/test-context";
import { hashPassword, comparePassword } from "@/modules/auth/internal/auth-util";
import { generateTokenPair, verifyToken } from "@/lib/auth/jwt";
import { signupSchema, loginSchema } from "@/features/auth/schemas";

// ── Route Handlers ─────────────────────────────────────────────────────────────
// Auth
import { POST as signupHandler } from "@/app/api/auth/signup/route";
import { POST as loginHandler } from "@/app/api/auth/login/route";
import { GET as authMeHandler } from "@/app/api/auth/me/route";
import { POST as refreshHandler } from "@/app/api/auth/refresh/route";
import { POST as logoutHandler } from "@/app/api/auth/logout/route";
import { POST as resetRequestHandler } from "@/app/api/auth/reset-password/request/route";
import { POST as resetConfirmHandler } from "@/app/api/auth/reset-password/confirm/route";
import { GET as usersMeHandler } from "@/app/api/users/me/route";

// Warehouses & Locations
import { GET as listWarehouses, POST as createWarehouse } from "@/app/api/warehouses/route";
import { GET as getWarehouse, PATCH as updateWarehouse } from "@/app/api/warehouses/[id]/route";
import {
  GET as listWarehouseLocations,
  POST as createWarehouseLocation,
} from "@/app/api/warehouses/[id]/locations/route";
import { GET as getLocation, PATCH as updateLocation } from "@/app/api/locations/[id]/route";
import { GET as getLocationStock } from "@/app/api/locations/[id]/stock/route";

// Categories
import { GET as listCategories, POST as createCategory } from "@/app/api/categories/route";
import { GET as getCategory, PATCH as updateCategory } from "@/app/api/categories/[id]/route";

// Products
import { GET as listProducts, POST as createProduct } from "@/app/api/products/route";
import { GET as getProduct, PATCH as updateProduct } from "@/app/api/products/[id]/route";
import { GET as getProductStock } from "@/app/api/products/[id]/stock/route";

// Reorder Rules
import { GET as listReorderRules, POST as createReorderRule } from "@/app/api/reorder-rules/route";
import {
  GET as getReorderRule,
  PATCH as updateReorderRule,
  DELETE as deleteReorderRule,
} from "@/app/api/reorder-rules/[id]/route";

// Stock & Dashboard
import { GET as getStock } from "@/app/api/stock/route";
import { GET as getDashboard } from "@/app/api/dashboard/route";
import { GET as getLowStockAlerts } from "@/app/api/alerts/low-stock/route";

// Operations
import { GET as listReceipts, POST as createReceipt } from "@/app/api/operations/receipts/route";
import { GET as getReceipt, PATCH as updateReceipt } from "@/app/api/operations/receipts/[id]/route";
import { POST as confirmReceipt } from "@/app/api/operations/receipts/[id]/confirm/route";
import { POST as cancelReceipt } from "@/app/api/operations/receipts/[id]/cancel/route";

import { GET as listDeliveries, POST as createDelivery } from "@/app/api/operations/deliveries/route";
import { GET as getDelivery, PATCH as updateDelivery } from "@/app/api/operations/deliveries/[id]/route";
import { POST as confirmDelivery } from "@/app/api/operations/deliveries/[id]/confirm/route";
import { POST as cancelDelivery } from "@/app/api/operations/deliveries/[id]/cancel/route";

import { GET as listTransfers, POST as createTransfer } from "@/app/api/operations/transfers/route";
import { GET as getTransfer, PATCH as updateTransfer } from "@/app/api/operations/transfers/[id]/route";
import { POST as confirmTransfer } from "@/app/api/operations/transfers/[id]/confirm/route";
import { POST as cancelTransfer } from "@/app/api/operations/transfers/[id]/cancel/route";

import { GET as listAdjustments, POST as createAdjustment } from "@/app/api/operations/adjustments/route";
import { GET as getAdjustment, PATCH as updateAdjustment } from "@/app/api/operations/adjustments/[id]/route";
import { POST as confirmAdjustment } from "@/app/api/operations/adjustments/[id]/confirm/route";
import { POST as cancelAdjustment } from "@/app/api/operations/adjustments/[id]/cancel/route";

describe("StockSense Consolidated End-to-End API Integration Suite", () => {
  const timestamp = Date.now().toString().slice(-6);

  // Shared state created across the full lifecycle flow
  let authUser: { id: string; email: string; username: string; token: string; refreshToken: string };
  let testWarehouse: { id: string; name: string; code: string };
  let testLocation1: { id: string; name: string; code: string };
  let testLocation2: { id: string; name: string; code: string };
  let testCategory: { id: string; name: string };
  let testProduct: { id: string; name: string; sku: string };
  let testReorderRuleId: string;

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. Core Auth & Security Utilities
  // ═══════════════════════════════════════════════════════════════════════════
  describe("1. Core Auth & Security Utilities", () => {
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

      const decodedAccess = await verifyToken(tokens.accessToken, "access");
      expect(decodedAccess.sub).toBe(user.id);
      expect(decodedAccess.role).toBe(user.role);

      const decodedRefresh = await verifyToken(tokens.refreshToken, "refresh");
      expect(decodedRefresh.sub).toBe(user.id);
    });

    it("should validate signup and login schemas", () => {
      expect(
        signupSchema.safeParse({
          username: "validuser",
          email: "valid@test.com",
          password: "password123",
          role: "STAFF",
        }).success
      ).toBe(true);

      expect(
        signupSchema.safeParse({
          username: "u",
          email: "bad",
          password: "123",
        }).success
      ).toBe(false);

      expect(
        loginSchema.safeParse({
          identifier: "validuser",
          password: "password123",
        }).success
      ).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. Auth & Session Management API Endpoints
  // ═══════════════════════════════════════════════════════════════════════════
  describe("2. Auth & Session Management API Endpoints", () => {
    const signupData = {
      username: `e2e_user_${timestamp}`,
      email: `e2e_${timestamp}@stocksense.test`,
      password: "TestPassword123!",
      role: "MANAGER" as const,
    };

    it("POST /api/auth/signup - should reject invalid payload", async () => {
      const req = createJsonRequest("http://localhost:3000/api/auth/signup", "POST", {
        username: "x",
        email: "not-an-email",
        password: "short",
      });
      const res = await signupHandler(req);
      expect(res.status).toBe(422);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    it("POST /api/auth/signup - should register a new user and set auth cookies", async () => {
      const req = createJsonRequest("http://localhost:3000/api/auth/signup", "POST", signupData);
      const res = await signupHandler(req);
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.username).toBe(signupData.username);
      expect(json.data.email).toBe(signupData.email);

      const accessCookie = res.cookies.get("access_token")?.value;
      const refreshCookie = res.cookies.get("refresh_token")?.value;
      expect(accessCookie).toBeDefined();
      expect(refreshCookie).toBeDefined();

      authUser = {
        id: json.data.id,
        email: json.data.email,
        username: json.data.username,
        token: accessCookie!,
        refreshToken: refreshCookie!,
      };
    });

    it("POST /api/auth/signup - should reject duplicate username or email with 409", async () => {
      const req = createJsonRequest("http://localhost:3000/api/auth/signup", "POST", signupData);
      const res = await signupHandler(req);
      expect(res.status).toBe(409);
    });

    it("POST /api/auth/login - should authenticate user and issue cookies", async () => {
      const req = createJsonRequest("http://localhost:3000/api/auth/login", "POST", {
        identifier: signupData.email,
        password: signupData.password,
      });
      const res = await loginHandler(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.email).toBe(signupData.email);

      const token = res.cookies.get("access_token")?.value;
      const refreshToken = res.cookies.get("refresh_token")?.value;
      expect(token).toBeDefined();
      expect(refreshToken).toBeDefined();
      authUser.token = token!;
      authUser.refreshToken = refreshToken!;
    });

    it("POST /api/auth/login - should reject invalid credentials with 401", async () => {
      const req = createJsonRequest("http://localhost:3000/api/auth/login", "POST", {
        identifier: signupData.email,
        password: "WrongPassword999!",
      });
      const res = await loginHandler(req);
      expect(res.status).toBe(401);
    });

    it("GET /api/auth/me - should return authenticated user from token", async () => {
      const req = createJsonRequest("http://localhost:3000/api/auth/me", "GET", undefined, {
        token: authUser.token,
      });
      const res = await authMeHandler(req, {});
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.email).toBe(signupData.email);
    });

    it("GET /api/users/me - should return authenticated user details", async () => {
      const req = createJsonRequest("http://localhost:3000/api/users/me", "GET", undefined, {
        token: authUser.token,
      });
      const res = await usersMeHandler(req, {});
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.username).toBe(signupData.username);
    });

    it("POST /api/auth/refresh - should issue new tokens with valid refresh token cookie", async () => {
      const req = createJsonRequest("http://localhost:3000/api/auth/refresh", "POST", undefined, {
        refreshToken: authUser.refreshToken,
      });
      const res = await refreshHandler(req);
      expect(res.status).toBe(200);

      const newAccess = res.cookies.get("access_token")?.value;
      const newRefresh = res.cookies.get("refresh_token")?.value;
      expect(newAccess).toBeDefined();
      expect(newRefresh).toBeDefined();
      authUser.token = newAccess!;
      authUser.refreshToken = newRefresh!;
    });

    it("POST /api/auth/reset-password/request - should send generic response", async () => {
      const req = createJsonRequest("http://localhost:3000/api/auth/reset-password/request", "POST", {
        email: signupData.email,
      });
      const res = await resetRequestHandler(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.message).toContain("password reset code has been sent");
    });

    it("POST /api/auth/reset-password/confirm - should reject invalid OTP with 401", async () => {
      const req = createJsonRequest("http://localhost:3000/api/auth/reset-password/confirm", "POST", {
        email: signupData.email,
        otp: "000000",
        newPassword: "NewTestPassword123!",
      });
      const res = await resetConfirmHandler(req);
      expect(res.status).toBe(400);
    });

    it("POST /api/auth/logout - should clear authentication cookies", async () => {
      const res = await logoutHandler();
      expect(res.status).toBe(200);

      const accessCookie = res.cookies.get("access_token");
      expect(accessCookie?.value === "" || accessCookie?.maxAge === 0).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. Warehouses & Locations Master Data API Endpoints
  // ═══════════════════════════════════════════════════════════════════════════
  describe("3. Warehouses & Locations Master Data API Endpoints", () => {
    it("POST /api/warehouses - should create a new warehouse", async () => {
      const payload = {
        name: `E2E Warehouse ${timestamp}`,
        code: `WH-${timestamp}`,
        address: "742 Evergreen Terrace",
      };
      const req = createJsonRequest("http://localhost:3000/api/warehouses", "POST", payload);
      const res = await createWarehouse(req);
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.code).toBe(payload.code);
      expect(json.data.name).toBe(payload.name);

      testWarehouse = { id: json.data.id, name: json.data.name, code: json.data.code };
    });

    it("GET /api/warehouses - should list warehouses including the new one", async () => {
      const res = await listWarehouses();
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      const found = json.data.find((w: { id: string }) => w.id === testWarehouse.id);
      expect(found).toBeDefined();
    });

    it("GET /api/warehouses/:id - should get warehouse details", async () => {
      const req = createJsonRequest(`http://localhost:3000/api/warehouses/${testWarehouse.id}`, "GET");
      const res = await getWarehouse(req, routeContext(testWarehouse.id));
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.id).toBe(testWarehouse.id);
    });

    it("PATCH /api/warehouses/:id - should update warehouse details", async () => {
      const req = createJsonRequest(`http://localhost:3000/api/warehouses/${testWarehouse.id}`, "PATCH", {
        address: "Updated Address 999",
      });
      const res = await updateWarehouse(req, routeContext(testWarehouse.id));
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.address).toBe("Updated Address 999");
    });

    it("POST /api/warehouses/:id/locations - should create locations for warehouse", async () => {
      // Location 1 (Stock / Shelf A)
      const loc1Req = createJsonRequest(
        `http://localhost:3000/api/warehouses/${testWarehouse.id}/locations`,
        "POST",
        { name: "Shelf A", code: `SH-A-${timestamp}` }
      );
      const loc1Res = await createWarehouseLocation(loc1Req, routeContext(testWarehouse.id));
      expect(loc1Res.status).toBe(201);
      const loc1Json = await loc1Res.json();
      testLocation1 = { id: loc1Json.data.id, name: loc1Json.data.name, code: loc1Json.data.code };

      // Location 2 (Packing / Shelf B)
      const loc2Req = createJsonRequest(
        `http://localhost:3000/api/warehouses/${testWarehouse.id}/locations`,
        "POST",
        { name: "Shelf B", code: `SH-B-${timestamp}` }
      );
      const loc2Res = await createWarehouseLocation(loc2Req, routeContext(testWarehouse.id));
      expect(loc2Res.status).toBe(201);
      const loc2Json = await loc2Res.json();
      testLocation2 = { id: loc2Json.data.id, name: loc2Json.data.name, code: loc2Json.data.code };
    });

    it("GET /api/warehouses/:id/locations - should list warehouse locations", async () => {
      const req = createJsonRequest(`http://localhost:3000/api/warehouses/${testWarehouse.id}/locations`, "GET");
      const res = await listWarehouseLocations(req, routeContext(testWarehouse.id));
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.length).toBeGreaterThanOrEqual(2);
    });

    it("GET /api/locations/:id - should get single location details", async () => {
      const req = createJsonRequest(`http://localhost:3000/api/locations/${testLocation1.id}`, "GET");
      const res = await getLocation(req, routeContext(testLocation1.id));
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.id).toBe(testLocation1.id);
    });

    it("PATCH /api/locations/:id - should update location name", async () => {
      const req = createJsonRequest(`http://localhost:3000/api/locations/${testLocation1.id}`, "PATCH", {
        name: "Primary Storage",
      });
      const res = await updateLocation(req, routeContext(testLocation1.id));
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.name).toBe("Primary Storage");
      testLocation1.name = "Primary Storage";
    });

    it("GET /api/locations/:id/stock - should return stock at location", async () => {
      const req = createJsonRequest(`http://localhost:3000/api/locations/${testLocation1.id}/stock`, "GET");
      const res = await getLocationStock(req, routeContext(testLocation1.id));
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(Array.isArray(json.data)).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. Categories Master Data API Endpoints
  // ═══════════════════════════════════════════════════════════════════════════
  describe("4. Categories Master Data API Endpoints", () => {
    it("POST /api/categories - should create a new category", async () => {
      const req = createJsonRequest("http://localhost:3000/api/categories", "POST", {
        name: `E2E Category ${timestamp}`,
      });
      const res = await createCategory(req);
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.name).toBe(`E2E Category ${timestamp}`);
      testCategory = { id: json.data.id, name: json.data.name };
    });

    it("POST /api/categories - should reject duplicate category with 409", async () => {
      const req = createJsonRequest("http://localhost:3000/api/categories", "POST", {
        name: testCategory.name,
      });
      const res = await createCategory(req);
      expect(res.status).toBe(409);
    });

    it("GET /api/categories - should list categories", async () => {
      const res = await listCategories();
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(Array.isArray(json.data)).toBe(true);
      const found = json.data.find((c: { id: string }) => c.id === testCategory.id);
      expect(found).toBeDefined();
    });

    it("GET /api/categories/:id - should get category by ID", async () => {
      const req = createJsonRequest(`http://localhost:3000/api/categories/${testCategory.id}`, "GET");
      const res = await getCategory(req, routeContext(testCategory.id));
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.id).toBe(testCategory.id);
    });

    it("PATCH /api/categories/:id - should update category name", async () => {
      const updatedName = `Updated Category ${timestamp}`;
      const req = createJsonRequest(`http://localhost:3000/api/categories/${testCategory.id}`, "PATCH", {
        name: updatedName,
      });
      const res = await updateCategory(req, routeContext(testCategory.id));
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.name).toBe(updatedName);
      testCategory.name = updatedName;
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. Products Master Data API Endpoints
  // ═══════════════════════════════════════════════════════════════════════════
  describe("5. Products Master Data API Endpoints", () => {
    it("POST /api/products - should create a product with initial stock", async () => {
      const payload = {
        name: `E2E Product ${timestamp}`,
        sku: `SKU-${timestamp}`,
        categoryId: testCategory.id,
        uom: "PCS",
        unitCost: "19.99",
        reorderPoint: 10,
        initialStock: 100,
        initialLocationId: testLocation1.id,
      };

      const req = createJsonRequest("http://localhost:3000/api/products", "POST", payload, {
        token: authUser.token,
      });
      const res = await createProduct(req);
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.sku).toBe(payload.sku);
      testProduct = { id: json.data.id, name: json.data.name, sku: json.data.sku };
    });

    it("GET /api/products - should list products with search query", async () => {
      const req = createJsonRequest(`http://localhost:3000/api/products?search=${testProduct.sku}`, "GET");
      const res = await listProducts(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.items.length).toBeGreaterThanOrEqual(1);
    });

    it("GET /api/products/:id - should get product details by ID", async () => {
      const req = createJsonRequest(`http://localhost:3000/api/products/${testProduct.id}`, "GET");
      const res = await getProduct(req, routeContext(testProduct.id));
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.id).toBe(testProduct.id);
    });

    it("PATCH /api/products/:id - should update product attributes", async () => {
      const req = createJsonRequest(`http://localhost:3000/api/products/${testProduct.id}`, "PATCH", {
        unitCost: "24.99",
      });
      const res = await updateProduct(req, routeContext(testProduct.id));
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(Number(json.data.unitCost)).toBe(24.99);
    });

    it("GET /api/products/:id/stock - should get stock levels for product", async () => {
      const req = createJsonRequest(`http://localhost:3000/api/products/${testProduct.id}/stock`, "GET");
      const res = await getProductStock(req, routeContext(testProduct.id));
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.totalOnHand).toBeGreaterThanOrEqual(100);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. Reorder Rules Management API Endpoints
  // ═══════════════════════════════════════════════════════════════════════════
  describe("6. Reorder Rules Management API Endpoints", () => {
    it("POST /api/reorder-rules - should create reorder rule", async () => {
      const payload = {
        productId: testProduct.id,
        minQty: "15",
        maxQty: "150",
        isActive: true,
      };

      const req = createJsonRequest("http://localhost:3000/api/reorder-rules", "POST", payload);
      const res = await createReorderRule(req);
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.productId).toBe(testProduct.id);
      testReorderRuleId = json.data.id;
    });

    it("GET /api/reorder-rules - should list reorder rules", async () => {
      const req = createJsonRequest("http://localhost:3000/api/reorder-rules", "GET");
      const res = await listReorderRules(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data.items)).toBe(true);
    });

    it("GET /api/reorder-rules/:id - should get reorder rule by ID", async () => {
      const req = createJsonRequest(`http://localhost:3000/api/reorder-rules/${testReorderRuleId}`, "GET");
      const res = await getReorderRule(req, routeContext(testReorderRuleId));
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.id).toBe(testReorderRuleId);
    });

    it("PATCH /api/reorder-rules/:id - should update reorder rule", async () => {
      const req = createJsonRequest(`http://localhost:3000/api/reorder-rules/${testReorderRuleId}`, "PATCH", {
        maxQty: "200",
      });
      const res = await updateReorderRule(req, routeContext(testReorderRuleId));
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(Number(json.data.maxQty)).toBe(200);
    });

    it("DELETE /api/reorder-rules/:id - should delete reorder rule", async () => {
      const req = createJsonRequest(`http://localhost:3000/api/reorder-rules/${testReorderRuleId}`, "DELETE");
      const res = await deleteReorderRule(req, routeContext(testReorderRuleId));
      expect(res.status).toBe(204);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. Stock Read & Aggregation API Endpoints
  // ═══════════════════════════════════════════════════════════════════════════
  describe("7. Stock Read & Aggregation API Endpoints", () => {
    it("GET /api/stock - should list stock balances across warehouses", async () => {
      const req = createJsonRequest(
        `http://localhost:3000/api/stock?warehouseId=${testWarehouse.id}`,
        "GET"
      );
      const res = await getStock(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data.items)).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. Operations: Receipts Flow
  // ═══════════════════════════════════════════════════════════════════════════
  describe("8. Operations: Receipts Flow", () => {
    let receiptId: string;
    let cancelReceiptId: string;

    it("POST /api/operations/receipts - should create a receipt in DRAFT status", async () => {
      const payload = {
        warehouseId: testWarehouse.id,
        toLocationId: testLocation1.id,
        contactName: "Acme Supplier",
        address: "100 Supplier Way",
        responsibleUserId: authUser.id,
        items: [{ productId: testProduct.id, quantity: 40 }],
      };

      const req = createJsonRequest("http://localhost:3000/api/operations/receipts", "POST", payload);
      const res = await createReceipt(req);
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.status).toBe("DRAFT");
      expect(json.data.type).toBe("RECEIPT");
      receiptId = json.data.id;
    });

    it("GET /api/operations/receipts - should list receipts", async () => {
      const req = createJsonRequest(
        `http://localhost:3000/api/operations/receipts?warehouseId=${testWarehouse.id}&status=DRAFT`,
        "GET"
      );
      const res = await listReceipts(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(Array.isArray(json.data.items)).toBe(true);
    });

    it("GET /api/operations/receipts/:id - should get receipt by ID", async () => {
      const req = createJsonRequest(`http://localhost:3000/api/operations/receipts/${receiptId}`, "GET");
      const res = await getReceipt(req, routeContext(receiptId));
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.id).toBe(receiptId);
    });

    it("PATCH /api/operations/receipts/:id - should update receipt items", async () => {
      const req = createJsonRequest(`http://localhost:3000/api/operations/receipts/${receiptId}`, "PATCH", {
        contactName: "Updated Supplier LLC",
        items: [{ productId: testProduct.id, quantity: 50 }],
      });
      const res = await updateReceipt(req, routeContext(receiptId));
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.contactName).toBe("Updated Supplier LLC");
    });

    it("POST /api/operations/receipts/:id/confirm - should confirm receipt and increase stock", async () => {
      const req = createJsonRequest(`http://localhost:3000/api/operations/receipts/${receiptId}/confirm`, "POST");
      const res = await confirmReceipt(req, routeContext(receiptId));
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.status).toBe("DONE");

      // Verify stock in location increased by 50
      const stockReq = createJsonRequest(`http://localhost:3000/api/products/${testProduct.id}/stock`, "GET");
      const stockRes = await getProductStock(stockReq, routeContext(testProduct.id));
      const stockJson = await stockRes.json();
      expect(stockJson.data.totalOnHand).toBeGreaterThanOrEqual(150);
    });

    it("POST /api/operations/receipts/:id/cancel - should cancel a draft receipt", async () => {
      // Create a new draft receipt to cancel
      const createReq = createJsonRequest("http://localhost:3000/api/operations/receipts", "POST", {
        warehouseId: testWarehouse.id,
        toLocationId: testLocation1.id,
        contactName: "Cancel Candidate",
        responsibleUserId: authUser.id,
        items: [{ productId: testProduct.id, quantity: 5 }],
      });
      const createRes = await createReceipt(createReq);
      const createJson = await createRes.json();
      cancelReceiptId = createJson.data.id;

      const cancelReq = createJsonRequest(
        `http://localhost:3000/api/operations/receipts/${cancelReceiptId}/cancel`,
        "POST"
      );
      const cancelRes = await cancelReceipt(cancelReq, routeContext(cancelReceiptId));
      expect(cancelRes.status).toBe(200);

      const cancelJson = await cancelRes.json();
      expect(cancelJson.data.status).toBe("CANCELED");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. Operations: Internal Transfers Flow
  // ═══════════════════════════════════════════════════════════════════════════
  describe("9. Operations: Internal Transfers Flow", () => {
    let transferId: string;
    let cancelTransferId: string;

    it("POST /api/operations/transfers - should create a transfer in DRAFT status", async () => {
      const payload = {
        warehouseId: testWarehouse.id,
        fromLocationId: testLocation1.id,
        toLocationId: testLocation2.id,
        responsibleUserId: authUser.id,
        items: [{ productId: testProduct.id, quantity: 20 }],
      };

      const req = createJsonRequest("http://localhost:3000/api/operations/transfers", "POST", payload);
      const res = await createTransfer(req);
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.status).toBe("DRAFT");
      expect(json.data.type).toBe("TRANSFER");
      transferId = json.data.id;
    });

    it("GET /api/operations/transfers - should list transfers", async () => {
      const req = createJsonRequest(`http://localhost:3000/api/operations/transfers?warehouseId=${testWarehouse.id}`, "GET");
      const res = await listTransfers(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(Array.isArray(json.data.items)).toBe(true);
    });

    it("GET /api/operations/transfers/:id - should get transfer by ID", async () => {
      const req = createJsonRequest(`http://localhost:3000/api/operations/transfers/${transferId}`, "GET");
      const res = await getTransfer(req, routeContext(transferId));
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.id).toBe(transferId);
    });

    it("PATCH /api/operations/transfers/:id - should update transfer details", async () => {
      const req = createJsonRequest(`http://localhost:3000/api/operations/transfers/${transferId}`, "PATCH", {
        items: [{ productId: testProduct.id, quantity: 25 }],
      });
      const res = await updateTransfer(req, routeContext(transferId));
      expect(res.status).toBe(200);
    });

    it("POST /api/operations/transfers/:id/confirm - should confirm transfer and move stock", async () => {
      const req = createJsonRequest(`http://localhost:3000/api/operations/transfers/${transferId}/confirm`, "POST");
      const res = await confirmTransfer(req, routeContext(transferId));
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.status).toBe("DONE");
    });

    it("POST /api/operations/transfers/:id/cancel - should cancel a draft transfer", async () => {
      const createReq = createJsonRequest("http://localhost:3000/api/operations/transfers", "POST", {
        warehouseId: testWarehouse.id,
        fromLocationId: testLocation1.id,
        toLocationId: testLocation2.id,
        responsibleUserId: authUser.id,
        items: [{ productId: testProduct.id, quantity: 5 }],
      });
      const createRes = await createTransfer(createReq);
      const createJson = await createRes.json();
      cancelTransferId = createJson.data.id;

      const cancelReq = createJsonRequest(
        `http://localhost:3000/api/operations/transfers/${cancelTransferId}/cancel`,
        "POST"
      );
      const cancelRes = await cancelTransfer(cancelReq, routeContext(cancelTransferId));
      expect(cancelRes.status).toBe(200);

      const cancelJson = await cancelRes.json();
      expect(cancelJson.data.status).toBe("CANCELED");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. Operations: Delivery Orders Flow
  // ═══════════════════════════════════════════════════════════════════════════
  describe("10. Operations: Delivery Orders Flow", () => {
    let deliveryId: string;
    let cancelDeliveryId: string;

    it("POST /api/operations/deliveries - should create a delivery order in DRAFT status", async () => {
      const payload = {
        warehouseId: testWarehouse.id,
        fromLocationId: testLocation2.id,
        contactName: "Client Global Corp",
        address: "500 Commerce Ave",
        responsibleUserId: authUser.id,
        items: [{ productId: testProduct.id, quantity: 10 }],
      };

      const req = createJsonRequest("http://localhost:3000/api/operations/deliveries", "POST", payload);
      const res = await createDelivery(req);
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.status).toBe("DRAFT");
      expect(json.data.type).toBe("DELIVERY");
      deliveryId = json.data.id;
    });

    it("GET /api/operations/deliveries - should list deliveries", async () => {
      const req = createJsonRequest(`http://localhost:3000/api/operations/deliveries?warehouseId=${testWarehouse.id}`, "GET");
      const res = await listDeliveries(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(Array.isArray(json.data.items)).toBe(true);
    });

    it("GET /api/operations/deliveries/:id - should get delivery details by ID", async () => {
      const req = createJsonRequest(`http://localhost:3000/api/operations/deliveries/${deliveryId}`, "GET");
      const res = await getDelivery(req, routeContext(deliveryId));
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.id).toBe(deliveryId);
    });

    it("PATCH /api/operations/deliveries/:id - should update delivery details", async () => {
      const req = createJsonRequest(`http://localhost:3000/api/operations/deliveries/${deliveryId}`, "PATCH", {
        contactName: "Client Global Corp Ltd",
      });
      const res = await updateDelivery(req, routeContext(deliveryId));
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.contactName).toBe("Client Global Corp Ltd");
    });

    it("POST /api/operations/deliveries/:id/confirm - should confirm delivery and reduce stock", async () => {
      const req = createJsonRequest(`http://localhost:3000/api/operations/deliveries/${deliveryId}/confirm`, "POST");
      const res = await confirmDelivery(req, routeContext(deliveryId));
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.status).toBe("DONE");
    });

    it("POST /api/operations/deliveries/:id/cancel - should cancel a draft delivery order", async () => {
      const createReq = createJsonRequest("http://localhost:3000/api/operations/deliveries", "POST", {
        warehouseId: testWarehouse.id,
        fromLocationId: testLocation2.id,
        contactName: "Cancel Delivery Candidate",
        responsibleUserId: authUser.id,
        items: [{ productId: testProduct.id, quantity: 2 }],
      });
      const createRes = await createDelivery(createReq);
      const createJson = await createRes.json();
      cancelDeliveryId = createJson.data.id;

      const cancelReq = createJsonRequest(
        `http://localhost:3000/api/operations/deliveries/${cancelDeliveryId}/cancel`,
        "POST"
      );
      const cancelRes = await cancelDelivery(cancelReq, routeContext(cancelDeliveryId));
      expect(cancelRes.status).toBe(200);

      const cancelJson = await cancelRes.json();
      expect(cancelJson.data.status).toBe("CANCELED");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. Operations: Inventory Adjustments Flow
  // ═══════════════════════════════════════════════════════════════════════════
  describe("11. Operations: Inventory Adjustments Flow", () => {
    let adjustmentId: string;
    let cancelAdjustmentId: string;

    it("POST /api/operations/adjustments - should create an adjustment in DRAFT status", async () => {
      const payload = {
        warehouseId: testWarehouse.id,
        toLocationId: testLocation1.id,
        responsibleUserId: authUser.id,
        items: [{ productId: testProduct.id, quantity: 50, countedQuantity: 55 }],
      };

      const req = createJsonRequest("http://localhost:3000/api/operations/adjustments", "POST", payload);
      const res = await createAdjustment(req);
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.status).toBe("DRAFT");
      expect(json.data.type).toBe("ADJUSTMENT");
      adjustmentId = json.data.id;
    });

    it("GET /api/operations/adjustments - should list adjustments", async () => {
      const req = createJsonRequest(`http://localhost:3000/api/operations/adjustments?warehouseId=${testWarehouse.id}`, "GET");
      const res = await listAdjustments(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(Array.isArray(json.data.items)).toBe(true);
    });

    it("GET /api/operations/adjustments/:id - should get adjustment by ID", async () => {
      const req = createJsonRequest(`http://localhost:3000/api/operations/adjustments/${adjustmentId}`, "GET");
      const res = await getAdjustment(req, routeContext(adjustmentId));
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.id).toBe(adjustmentId);
    });

    it("PATCH /api/operations/adjustments/:id - should update adjustment quantity", async () => {
      const req = createJsonRequest(`http://localhost:3000/api/operations/adjustments/${adjustmentId}`, "PATCH", {
        items: [{ productId: testProduct.id, quantity: 50, countedQuantity: 60 }],
      });
      const res = await updateAdjustment(req, routeContext(adjustmentId));
      expect(res.status).toBe(200);
    });

    it("POST /api/operations/adjustments/:id/confirm - should confirm adjustment", async () => {
      const req = createJsonRequest(`http://localhost:3000/api/operations/adjustments/${adjustmentId}/confirm`, "POST");
      const res = await confirmAdjustment(req, routeContext(adjustmentId));
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.status).toBe("DONE");
    });

    it("POST /api/operations/adjustments/:id/cancel - should cancel a draft adjustment", async () => {
      const createReq = createJsonRequest("http://localhost:3000/api/operations/adjustments", "POST", {
        warehouseId: testWarehouse.id,
        toLocationId: testLocation1.id,
        responsibleUserId: authUser.id,
        items: [{ productId: testProduct.id, quantity: 50, countedQuantity: 52 }],
      });
      const createRes = await createAdjustment(createReq);
      const createJson = await createRes.json();
      cancelAdjustmentId = createJson.data.id;

      const cancelReq = createJsonRequest(
        `http://localhost:3000/api/operations/adjustments/${cancelAdjustmentId}/cancel`,
        "POST"
      );
      const cancelRes = await cancelAdjustment(cancelReq, routeContext(cancelAdjustmentId));
      expect(cancelRes.status).toBe(200);

      const cancelJson = await cancelRes.json();
      expect(cancelJson.data.status).toBe("CANCELED");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 12. Dashboard Analytics & Summary API
  // ═══════════════════════════════════════════════════════════════════════════
  describe("12. Dashboard Analytics & Summary API", () => {
    it("GET /api/dashboard - should return KPIs and operation counts", async () => {
      const res = await getDashboard(new Request("http://localhost:3000/api/dashboard"));
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(typeof json.data.totalProductsInStock).toBe("number");
      expect(typeof json.data.lowStockItems).toBe("number");
      expect(typeof json.data.pendingReceipts).toBe("number");
    });

    it("GET /api/alerts/low-stock - should return low stock alerts list", async () => {
      const res = await getLowStockAlerts();
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
    });
  });
});
