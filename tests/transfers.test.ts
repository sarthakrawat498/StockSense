import { GET, POST } from "@/app/api/operations/transfers/route";
import { GET as getById, PATCH } from "@/app/api/operations/transfers/[id]/route";
import { POST as confirmTransfer } from "@/app/api/operations/transfers/[id]/confirm/route";
import { POST as cancelTransfer } from "@/app/api/operations/transfers/[id]/cancel/route";
import { POST as createReceipt } from "@/app/api/operations/receipts/route";
import { POST as confirmReceipt } from "@/app/api/operations/receipts/[id]/confirm/route";
import { prisma } from "@/lib/db";
import { getTestContext, createJsonRequest, TestContext } from "./helpers/test-context";

describe("Transfers API Endpoints", () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await getTestContext();

    // Ensure loc1 has stock to transfer (add 100 units via receipt)
    const receiptReq = createJsonRequest("http://localhost:3000/api/operations/receipts", "POST", {
      warehouseId: ctx.warehouseId,
      toLocationId: ctx.loc1Id,
      responsibleUserId: ctx.userId,
      items: [{ productId: ctx.productId, quantity: 100 }],
    });
    const receiptRes = await createReceipt(receiptReq);
    const { data: receipt } = await receiptRes.json();

    const confirmReq = createJsonRequest(
      `http://localhost:3000/api/operations/receipts/${receipt.id}/confirm`,
      "POST",
    );
    await confirmReceipt(confirmReq, { params: Promise.resolve({ id: receipt.id }) });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("POST /api/operations/transfers - should create transfer in DRAFT status", async () => {
    const payload = {
      warehouseId: ctx.warehouseId,
      fromLocationId: ctx.loc1Id,
      toLocationId: ctx.loc2Id,
      responsibleUserId: ctx.userId,
      items: [{ productId: ctx.productId, quantity: 15 }],
    };

    const req = createJsonRequest("http://localhost:3000/api/operations/transfers", "POST", payload);
    const res = await POST(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.status).toBe("DRAFT");
    expect(json.data.type).toBe("TRANSFER");
    expect(json.data.fromLocationId).toBe(ctx.loc1Id);
    expect(json.data.toLocationId).toBe(ctx.loc2Id);
  });

  it("POST /api/operations/transfers - should reject transfer when from and to locations are identical", async () => {
    const payload = {
      warehouseId: ctx.warehouseId,
      fromLocationId: ctx.loc1Id,
      toLocationId: ctx.loc1Id,
      responsibleUserId: ctx.userId,
      items: [{ productId: ctx.productId, quantity: 5 }],
    };

    const req = createJsonRequest("http://localhost:3000/api/operations/transfers", "POST", payload);
    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.message).toContain("different");
  });

  it("GET /api/operations/transfers - should list transfers", async () => {
    const req = createJsonRequest("http://localhost:3000/api/operations/transfers", "GET");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data.items)).toBe(true);
  });

  it("GET /api/operations/transfers/:id - should get transfer details by ID", async () => {
    const createReq = createJsonRequest("http://localhost:3000/api/operations/transfers", "POST", {
      warehouseId: ctx.warehouseId,
      fromLocationId: ctx.loc1Id,
      toLocationId: ctx.loc2Id,
      responsibleUserId: ctx.userId,
      items: [{ productId: ctx.productId, quantity: 5 }],
    });
    const createRes = await POST(createReq);
    const { data: created } = await createRes.json();

    const req = createJsonRequest(`http://localhost:3000/api/operations/transfers/${created.id}`, "GET");
    const res = await getById(req, { params: Promise.resolve({ id: created.id }) });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.id).toBe(created.id);
  });

  it("PATCH /api/operations/transfers/:id - should reject update with identical from and to locations", async () => {
    const createReq = createJsonRequest("http://localhost:3000/api/operations/transfers", "POST", {
      warehouseId: ctx.warehouseId,
      fromLocationId: ctx.loc1Id,
      toLocationId: ctx.loc2Id,
      responsibleUserId: ctx.userId,
      items: [{ productId: ctx.productId, quantity: 5 }],
    });
    const createRes = await POST(createReq);
    const { data: created } = await createRes.json();

    const patchReq = createJsonRequest(`http://localhost:3000/api/operations/transfers/${created.id}`, "PATCH", {
      fromLocationId: ctx.loc1Id,
      toLocationId: ctx.loc1Id,
    });
    const patchRes = await PATCH(patchReq, { params: Promise.resolve({ id: created.id }) });
    expect(patchRes.status).toBe(400);
  });

  it("POST /api/operations/transfers/:id/confirm - should confirm transfer, moving stock and adding ledger", async () => {
    const srcBefore = await prisma.stockBalance.findUnique({
      where: { productId_locationId: { productId: ctx.productId, locationId: ctx.loc1Id } },
    });
    const destBefore = await prisma.stockBalance.findUnique({
      where: { productId_locationId: { productId: ctx.productId, locationId: ctx.loc2Id } },
    });
    const srcQtyBefore = Number(srcBefore?.onHandQty ?? 0);
    const destQtyBefore = Number(destBefore?.onHandQty ?? 0);

    const createReq = createJsonRequest("http://localhost:3000/api/operations/transfers", "POST", {
      warehouseId: ctx.warehouseId,
      fromLocationId: ctx.loc1Id,
      toLocationId: ctx.loc2Id,
      responsibleUserId: ctx.userId,
      items: [{ productId: ctx.productId, quantity: 20 }],
    });
    const createRes = await POST(createReq);
    const { data: created } = await createRes.json();

    const confirmReq = createJsonRequest(
      `http://localhost:3000/api/operations/transfers/${created.id}/confirm`,
      "POST",
      { performedById: ctx.userId },
    );
    const confirmRes = await confirmTransfer(confirmReq, { params: Promise.resolve({ id: created.id }) });
    expect(confirmRes.status).toBe(200);

    const json = await confirmRes.json();
    expect(json.success).toBe(true);
    expect(json.data.status).toBe("DONE");

    // Verify source stock decremented
    const srcAfter = await prisma.stockBalance.findUnique({
      where: { productId_locationId: { productId: ctx.productId, locationId: ctx.loc1Id } },
    });
    expect(Number(srcAfter?.onHandQty)).toBe(srcQtyBefore - 20);

    // Verify destination stock incremented
    const destAfter = await prisma.stockBalance.findUnique({
      where: { productId_locationId: { productId: ctx.productId, locationId: ctx.loc2Id } },
    });
    expect(Number(destAfter?.onHandQty)).toBe(destQtyBefore + 20);

    // Verify ledger entry
    const ledger = await prisma.stockLedger.findFirst({
      where: { operationId: created.id },
    });
    expect(ledger?.movementType).toBe("TRANSFER");
    expect(ledger?.fromLocationId).toBe(ctx.loc1Id);
    expect(ledger?.toLocationId).toBe(ctx.loc2Id);
    expect(Number(ledger?.quantity)).toBe(20);
  });

  it("POST /api/operations/transfers/:id/confirm - should reject transfer when source has insufficient stock", async () => {
    const createReq = createJsonRequest("http://localhost:3000/api/operations/transfers", "POST", {
      warehouseId: ctx.warehouseId,
      fromLocationId: ctx.loc1Id,
      toLocationId: ctx.loc2Id,
      responsibleUserId: ctx.userId,
      items: [{ productId: ctx.productId, quantity: 999999 }],
    });
    const createRes = await POST(createReq);
    const { data: created } = await createRes.json();

    const confirmReq = createJsonRequest(
      `http://localhost:3000/api/operations/transfers/${created.id}/confirm`,
      "POST",
    );
    const confirmRes = await confirmTransfer(confirmReq, { params: Promise.resolve({ id: created.id }) });
    expect(confirmRes.status).toBe(422);

    const json = await confirmRes.json();
    expect(json.success).toBe(false);
    expect(json.message).toContain("Insufficient stock");
  });

  it("POST /api/operations/transfers/:id/cancel - should cancel a DRAFT transfer", async () => {
    const createReq = createJsonRequest("http://localhost:3000/api/operations/transfers", "POST", {
      warehouseId: ctx.warehouseId,
      fromLocationId: ctx.loc1Id,
      toLocationId: ctx.loc2Id,
      responsibleUserId: ctx.userId,
      items: [{ productId: ctx.productId, quantity: 2 }],
    });
    const createRes = await POST(createReq);
    const { data: created } = await createRes.json();

    const cancelReq = createJsonRequest(`http://localhost:3000/api/operations/transfers/${created.id}/cancel`, "POST");
    const cancelRes = await cancelTransfer(cancelReq, { params: Promise.resolve({ id: created.id }) });
    expect(cancelRes.status).toBe(200);

    const json = await cancelRes.json();
    expect(json.success).toBe(true);
    expect(json.data.status).toBe("CANCELED");
  });

  it("POST /api/operations/transfers/:id/confirm - should reject confirming already DONE transfer", async () => {
    const createReq = createJsonRequest("http://localhost:3000/api/operations/transfers", "POST", {
      warehouseId: ctx.warehouseId,
      fromLocationId: ctx.loc1Id,
      toLocationId: ctx.loc2Id,
      responsibleUserId: ctx.userId,
      items: [{ productId: ctx.productId, quantity: 1 }],
    });
    const createRes = await POST(createReq);
    const { data: created } = await createRes.json();

    const confirmReq1 = createJsonRequest(
      `http://localhost:3000/api/operations/transfers/${created.id}/confirm`,
      "POST",
    );
    await confirmTransfer(confirmReq1, { params: Promise.resolve({ id: created.id }) });

    // Second confirm -> 422
    const confirmReq2 = createJsonRequest(
      `http://localhost:3000/api/operations/transfers/${created.id}/confirm`,
      "POST",
    );
    const confirmRes2 = await confirmTransfer(confirmReq2, { params: Promise.resolve({ id: created.id }) });
    expect(confirmRes2.status).toBe(422);
  });

  it("PATCH /api/operations/transfers/:id - should reject editing a DONE transfer", async () => {
    const createReq = createJsonRequest("http://localhost:3000/api/operations/transfers", "POST", {
      warehouseId: ctx.warehouseId,
      fromLocationId: ctx.loc1Id,
      toLocationId: ctx.loc2Id,
      responsibleUserId: ctx.userId,
      items: [{ productId: ctx.productId, quantity: 1 }],
    });
    const createRes = await POST(createReq);
    const { data: created } = await createRes.json();

    const confirmReq = createJsonRequest(
      `http://localhost:3000/api/operations/transfers/${created.id}/confirm`,
      "POST",
    );
    await confirmTransfer(confirmReq, { params: Promise.resolve({ id: created.id }) });

    const patchReq = createJsonRequest(`http://localhost:3000/api/operations/transfers/${created.id}`, "PATCH", {
      scheduledDate: "2026-11-01T00:00:00Z",
    });
    const patchRes = await PATCH(patchReq, { params: Promise.resolve({ id: created.id }) });
    expect(patchRes.status).toBe(422);
  });

  it("POST /api/operations/transfers/:id/confirm - should reject confirming a CANCELED transfer", async () => {
    const createReq = createJsonRequest("http://localhost:3000/api/operations/transfers", "POST", {
      warehouseId: ctx.warehouseId,
      fromLocationId: ctx.loc1Id,
      toLocationId: ctx.loc2Id,
      responsibleUserId: ctx.userId,
      items: [{ productId: ctx.productId, quantity: 1 }],
    });
    const createRes = await POST(createReq);
    const { data: created } = await createRes.json();

    const cancelReq = createJsonRequest(`http://localhost:3000/api/operations/transfers/${created.id}/cancel`, "POST");
    await cancelTransfer(cancelReq, { params: Promise.resolve({ id: created.id }) });

    const confirmReq = createJsonRequest(
      `http://localhost:3000/api/operations/transfers/${created.id}/confirm`,
      "POST",
    );
    const confirmRes = await confirmTransfer(confirmReq, { params: Promise.resolve({ id: created.id }) });
    expect(confirmRes.status).toBe(422);
  });
});
