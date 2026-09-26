import { GET, POST } from "@/app/api/operations/receipts/route";
import { GET as getById, PATCH } from "@/app/api/operations/receipts/[id]/route";
import { POST as confirmReceipt } from "@/app/api/operations/receipts/[id]/confirm/route";
import { POST as cancelReceipt } from "@/app/api/operations/receipts/[id]/cancel/route";
import { prisma } from "@/lib/db";
import { getTestContext, createJsonRequest, TestContext } from "./helpers/test-context";

describe("Receipts API Endpoints", () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await getTestContext();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("POST /api/operations/receipts - should create a receipt in DRAFT status", async () => {
    const payload = {
      warehouseId: ctx.warehouseId,
      toLocationId: ctx.loc1Id,
      contactName: "Jest Test Supplier",
      address: "100 Test Blvd",
      responsibleUserId: ctx.userId,
      items: [{ productId: ctx.productId, quantity: 50 }],
    };

    const req = createJsonRequest("http://localhost:3000/api/operations/receipts", "POST", payload);
    const res = await POST(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.status).toBe("DRAFT");
    expect(json.data.type).toBe("RECEIPT");
    expect(json.data.items).toHaveLength(1);
  });

  it("GET /api/operations/receipts - should list receipts with pagination", async () => {
    const req = createJsonRequest("http://localhost:3000/api/operations/receipts?page=1&pageSize=10", "GET");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data.items)).toBe(true);
    expect(json.data.page).toBe(1);
    expect(json.data.pageSize).toBe(10);
  });

  it("GET /api/operations/receipts - should filter by status and warehouse", async () => {
    const req = createJsonRequest(
      `http://localhost:3000/api/operations/receipts?warehouseId=${ctx.warehouseId}&status=DRAFT`,
      "GET",
    );
    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    for (const item of json.data.items) {
      expect(item.status).toBe("DRAFT");
      expect(item.warehouseId).toBe(ctx.warehouseId);
    }
  });

  it("GET /api/operations/receipts/:id - should get receipt by ID", async () => {
    // Create receipt first
    const createReq = createJsonRequest("http://localhost:3000/api/operations/receipts", "POST", {
      warehouseId: ctx.warehouseId,
      toLocationId: ctx.loc1Id,
      responsibleUserId: ctx.userId,
      items: [{ productId: ctx.productId, quantity: 10 }],
    });
    const createRes = await POST(createReq);
    const { data: created } = await createRes.json();

    const req = createJsonRequest(`http://localhost:3000/api/operations/receipts/${created.id}`, "GET");
    const res = await getById(req, { params: Promise.resolve({ id: created.id }) });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.id).toBe(created.id);
    expect(json.data.items[0].product).toBeDefined();
  });

  it("GET /api/operations/receipts/:id - should return 404 for non-existent receipt", async () => {
    const fakeId = "00000000-0000-0000-0000-000000000999";
    const req = createJsonRequest(`http://localhost:3000/api/operations/receipts/${fakeId}`, "GET");
    const res = await getById(req, { params: Promise.resolve({ id: fakeId }) });
    expect(res.status).toBe(404);

    const json = await res.json();
    expect(json.success).toBe(false);
  });

  it("PATCH /api/operations/receipts/:id - should update DRAFT receipt fields", async () => {
    const createReq = createJsonRequest("http://localhost:3000/api/operations/receipts", "POST", {
      warehouseId: ctx.warehouseId,
      toLocationId: ctx.loc1Id,
      contactName: "Initial Supplier",
      responsibleUserId: ctx.userId,
      items: [{ productId: ctx.productId, quantity: 5 }],
    });
    const createRes = await POST(createReq);
    const { data: created } = await createRes.json();

    const patchReq = createJsonRequest(`http://localhost:3000/api/operations/receipts/${created.id}`, "PATCH", {
      contactName: "Updated Supplier Co",
    });
    const patchRes = await PATCH(patchReq, { params: Promise.resolve({ id: created.id }) });
    expect(patchRes.status).toBe(200);

    const json = await patchRes.json();
    expect(json.success).toBe(true);
    expect(json.data.contactName).toBe("Updated Supplier Co");
  });

  it("POST /api/operations/receipts/:id/confirm - should confirm receipt, increment stock, and add ledger", async () => {
    // Check initial stock
    const initialBalance = await prisma.stockBalance.findUnique({
      where: { productId_locationId: { productId: ctx.productId, locationId: ctx.loc1Id } },
    });
    const initialQty = initialBalance ? Number(initialBalance.onHandQty) : 0;

    // Create receipt for 25 units
    const createReq = createJsonRequest("http://localhost:3000/api/operations/receipts", "POST", {
      warehouseId: ctx.warehouseId,
      toLocationId: ctx.loc1Id,
      responsibleUserId: ctx.userId,
      items: [{ productId: ctx.productId, quantity: 25 }],
    });
    const createRes = await POST(createReq);
    const { data: created } = await createRes.json();

    // Confirm receipt
    const confirmReq = createJsonRequest(
      `http://localhost:3000/api/operations/receipts/${created.id}/confirm`,
      "POST",
      { performedById: ctx.userId },
    );
    const confirmRes = await confirmReceipt(confirmReq, { params: Promise.resolve({ id: created.id }) });
    expect(confirmRes.status).toBe(200);

    const json = await confirmRes.json();
    expect(json.success).toBe(true);
    expect(json.data.status).toBe("DONE");
    expect(json.data.validatedAt).toBeDefined();

    // Verify stock balance incremented
    const updatedBalance = await prisma.stockBalance.findUnique({
      where: { productId_locationId: { productId: ctx.productId, locationId: ctx.loc1Id } },
    });
    expect(Number(updatedBalance?.onHandQty)).toBe(initialQty + 25);

    // Verify ledger entry created
    const ledger = await prisma.stockLedger.findFirst({
      where: { operationId: created.id },
    });
    expect(ledger).toBeDefined();
    expect(ledger?.movementType).toBe("RECEIPT");
    expect(Number(ledger?.quantity)).toBe(25);
  });

  it("POST /api/operations/receipts/:id/confirm - should reject confirming already DONE receipt", async () => {
    const createReq = createJsonRequest("http://localhost:3000/api/operations/receipts", "POST", {
      warehouseId: ctx.warehouseId,
      toLocationId: ctx.loc1Id,
      responsibleUserId: ctx.userId,
      items: [{ productId: ctx.productId, quantity: 5 }],
    });
    const createRes = await POST(createReq);
    const { data: created } = await createRes.json();

    // First confirm
    const confirmReq1 = createJsonRequest(
      `http://localhost:3000/api/operations/receipts/${created.id}/confirm`,
      "POST",
      { performedById: ctx.userId },
    );
    await confirmReceipt(confirmReq1, { params: Promise.resolve({ id: created.id }) });

    // Second confirm should fail (422)
    const confirmReq2 = createJsonRequest(
      `http://localhost:3000/api/operations/receipts/${created.id}/confirm`,
      "POST",
    );
    const confirmRes2 = await confirmReceipt(confirmReq2, { params: Promise.resolve({ id: created.id }) });
    expect(confirmRes2.status).toBe(422);
  });

  it("PATCH /api/operations/receipts/:id - should reject editing a DONE receipt", async () => {
    const createReq = createJsonRequest("http://localhost:3000/api/operations/receipts", "POST", {
      warehouseId: ctx.warehouseId,
      toLocationId: ctx.loc1Id,
      responsibleUserId: ctx.userId,
      items: [{ productId: ctx.productId, quantity: 5 }],
    });
    const createRes = await POST(createReq);
    const { data: created } = await createRes.json();

    // Confirm it
    const confirmReq = createJsonRequest(
      `http://localhost:3000/api/operations/receipts/${created.id}/confirm`,
      "POST",
    );
    await confirmReceipt(confirmReq, { params: Promise.resolve({ id: created.id }) });

    // Attempt PATCH -> should be 422
    const patchReq = createJsonRequest(`http://localhost:3000/api/operations/receipts/${created.id}`, "PATCH", {
      contactName: "Changed Name",
    });
    const patchRes = await PATCH(patchReq, { params: Promise.resolve({ id: created.id }) });
    expect(patchRes.status).toBe(422);
  });

  it("POST /api/operations/receipts/:id/cancel - should cancel a DRAFT receipt", async () => {
    const createReq = createJsonRequest("http://localhost:3000/api/operations/receipts", "POST", {
      warehouseId: ctx.warehouseId,
      toLocationId: ctx.loc1Id,
      responsibleUserId: ctx.userId,
      items: [{ productId: ctx.productId, quantity: 5 }],
    });
    const createRes = await POST(createReq);
    const { data: created } = await createRes.json();

    const cancelReq = createJsonRequest(`http://localhost:3000/api/operations/receipts/${created.id}/cancel`, "POST");
    const cancelRes = await cancelReceipt(cancelReq, { params: Promise.resolve({ id: created.id }) });
    expect(cancelRes.status).toBe(200);

    const json = await cancelRes.json();
    expect(json.success).toBe(true);
    expect(json.data.status).toBe("CANCELED");
    expect(json.data.canceledAt).toBeDefined();
  });

  it("POST /api/operations/receipts/:id/confirm - should reject confirming a CANCELED receipt", async () => {
    const createReq = createJsonRequest("http://localhost:3000/api/operations/receipts", "POST", {
      warehouseId: ctx.warehouseId,
      toLocationId: ctx.loc1Id,
      responsibleUserId: ctx.userId,
      items: [{ productId: ctx.productId, quantity: 5 }],
    });
    const createRes = await POST(createReq);
    const { data: created } = await createRes.json();

    // Cancel it
    const cancelReq = createJsonRequest(`http://localhost:3000/api/operations/receipts/${created.id}/cancel`, "POST");
    await cancelReceipt(cancelReq, { params: Promise.resolve({ id: created.id }) });

    // Attempt confirm -> 422
    const confirmReq = createJsonRequest(
      `http://localhost:3000/api/operations/receipts/${created.id}/confirm`,
      "POST",
    );
    const confirmRes = await confirmReceipt(confirmReq, { params: Promise.resolve({ id: created.id }) });
    expect(confirmRes.status).toBe(422);
  });
});
