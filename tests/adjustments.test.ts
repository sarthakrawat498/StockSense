import { GET, POST } from "@/app/api/operations/adjustments/route";
import { GET as getById, PATCH } from "@/app/api/operations/adjustments/[id]/route";
import { POST as confirmAdjustment } from "@/app/api/operations/adjustments/[id]/confirm/route";
import { POST as cancelAdjustment } from "@/app/api/operations/adjustments/[id]/cancel/route";
import { POST as createReceipt } from "@/app/api/operations/receipts/route";
import { POST as confirmReceipt } from "@/app/api/operations/receipts/[id]/confirm/route";
import { prisma } from "@/lib/db";
import { getTestContext, createJsonRequest, TestContext } from "./helpers/test-context";

describe("Adjustments API Endpoints", () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await getTestContext();

    // Ensure loc1 has known stock (add 50 units via receipt)
    const receiptReq = createJsonRequest("http://localhost:3000/api/operations/receipts", "POST", {
      warehouseId: ctx.warehouseId,
      toLocationId: ctx.loc1Id,
      responsibleUserId: ctx.userId,
      items: [{ productId: ctx.productId, quantity: 50 }],
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

  it("POST /api/operations/adjustments - should create adjustment in DRAFT status", async () => {
    const payload = {
      warehouseId: ctx.warehouseId,
      toLocationId: ctx.loc1Id,
      responsibleUserId: ctx.userId,
      items: [{ productId: ctx.productId, quantity: 50, countedQuantity: 55 }],
    };

    const req = createJsonRequest("http://localhost:3000/api/operations/adjustments", "POST", payload);
    const res = await POST(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.status).toBe("DRAFT");
    expect(json.data.type).toBe("ADJUSTMENT");
    expect(json.data.items[0].countedQuantity).toBe("55");
  });

  it("GET /api/operations/adjustments - should list adjustments", async () => {
    const req = createJsonRequest("http://localhost:3000/api/operations/adjustments", "GET");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data.items)).toBe(true);
  });

  it("GET /api/operations/adjustments/:id - should get adjustment details by ID", async () => {
    const createReq = createJsonRequest("http://localhost:3000/api/operations/adjustments", "POST", {
      warehouseId: ctx.warehouseId,
      toLocationId: ctx.loc1Id,
      responsibleUserId: ctx.userId,
      items: [{ productId: ctx.productId, quantity: 50, countedQuantity: 52 }],
    });
    const createRes = await POST(createReq);
    const { data: created } = await createRes.json();

    const req = createJsonRequest(`http://localhost:3000/api/operations/adjustments/${created.id}`, "GET");
    const res = await getById(req, { params: Promise.resolve({ id: created.id }) });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.id).toBe(created.id);
  });

  it("POST /api/operations/adjustments/:id/confirm - should apply positive delta (ADJUSTMENT_IN)", async () => {
    const balanceBefore = await prisma.stockBalance.findUnique({
      where: { productId_locationId: { productId: ctx.productId, locationId: ctx.loc1Id } },
    });
    const qtyBefore = Number(balanceBefore?.onHandQty ?? 0);

    // Theoretical is qtyBefore, counted is qtyBefore + 5
    const createReq = createJsonRequest("http://localhost:3000/api/operations/adjustments", "POST", {
      warehouseId: ctx.warehouseId,
      toLocationId: ctx.loc1Id,
      responsibleUserId: ctx.userId,
      items: [{ productId: ctx.productId, quantity: qtyBefore, countedQuantity: qtyBefore + 5 }],
    });
    const createRes = await POST(createReq);
    const { data: created } = await createRes.json();

    const confirmReq = createJsonRequest(
      `http://localhost:3000/api/operations/adjustments/${created.id}/confirm`,
      "POST",
      { performedById: ctx.userId },
    );
    const confirmRes = await confirmAdjustment(confirmReq, { params: Promise.resolve({ id: created.id }) });
    expect(confirmRes.status).toBe(200);

    const json = await confirmRes.json();
    expect(json.success).toBe(true);
    expect(json.data.status).toBe("DONE");

    // Stock should now be qtyBefore + 5
    const balanceAfter = await prisma.stockBalance.findUnique({
      where: { productId_locationId: { productId: ctx.productId, locationId: ctx.loc1Id } },
    });
    expect(Number(balanceAfter?.onHandQty)).toBe(qtyBefore + 5);

    // Ledger record movementType should be ADJUSTMENT_IN with quantity 5
    const ledger = await prisma.stockLedger.findFirst({
      where: { operationId: created.id },
    });
    expect(ledger?.movementType).toBe("ADJUSTMENT_IN");
    expect(Number(ledger?.quantity)).toBe(5);
  });

  it("POST /api/operations/adjustments/:id/confirm - should apply negative delta (ADJUSTMENT_OUT)", async () => {
    const balanceBefore = await prisma.stockBalance.findUnique({
      where: { productId_locationId: { productId: ctx.productId, locationId: ctx.loc1Id } },
    });
    const qtyBefore = Number(balanceBefore?.onHandQty ?? 0);

    // Theoretical is qtyBefore, counted is qtyBefore - 3
    const createReq = createJsonRequest("http://localhost:3000/api/operations/adjustments", "POST", {
      warehouseId: ctx.warehouseId,
      toLocationId: ctx.loc1Id,
      responsibleUserId: ctx.userId,
      items: [{ productId: ctx.productId, quantity: qtyBefore, countedQuantity: qtyBefore - 3 }],
    });
    const createRes = await POST(createReq);
    const { data: created } = await createRes.json();

    const confirmReq = createJsonRequest(
      `http://localhost:3000/api/operations/adjustments/${created.id}/confirm`,
      "POST",
      { performedById: ctx.userId },
    );
    const confirmRes = await confirmAdjustment(confirmReq, { params: Promise.resolve({ id: created.id }) });
    expect(confirmRes.status).toBe(200);

    const json = await confirmRes.json();
    expect(json.success).toBe(true);
    expect(json.data.status).toBe("DONE");

    // Stock should now be qtyBefore - 3
    const balanceAfter = await prisma.stockBalance.findUnique({
      where: { productId_locationId: { productId: ctx.productId, locationId: ctx.loc1Id } },
    });
    expect(Number(balanceAfter?.onHandQty)).toBe(qtyBefore - 3);

    // Ledger record movementType should be ADJUSTMENT_OUT with quantity 3
    const ledger = await prisma.stockLedger.findFirst({
      where: { operationId: created.id },
    });
    expect(ledger?.movementType).toBe("ADJUSTMENT_OUT");
    expect(Number(ledger?.quantity)).toBe(3);
  });

  it("POST /api/operations/adjustments/:id/cancel - should cancel a DRAFT adjustment", async () => {
    const createReq = createJsonRequest("http://localhost:3000/api/operations/adjustments", "POST", {
      warehouseId: ctx.warehouseId,
      toLocationId: ctx.loc1Id,
      responsibleUserId: ctx.userId,
      items: [{ productId: ctx.productId, quantity: 10, countedQuantity: 10 }],
    });
    const createRes = await POST(createReq);
    const { data: created } = await createRes.json();

    const cancelReq = createJsonRequest(`http://localhost:3000/api/operations/adjustments/${created.id}/cancel`, "POST");
    const cancelRes = await cancelAdjustment(cancelReq, { params: Promise.resolve({ id: created.id }) });
    expect(cancelRes.status).toBe(200);

    const json = await cancelRes.json();
    expect(json.success).toBe(true);
    expect(json.data.status).toBe("CANCELED");
  });

  it("POST /api/operations/adjustments/:id/confirm - should reject adjustment that attempts to reduce stock below zero", async () => {
    const balanceBefore = await prisma.stockBalance.findUnique({
      where: { productId_locationId: { productId: ctx.productId, locationId: ctx.loc1Id } },
    });
    const qtyBefore = Number(balanceBefore?.onHandQty ?? 0);

    // Delta of -(qtyBefore + 100) -> would drop stock below zero
    const createReq = createJsonRequest("http://localhost:3000/api/operations/adjustments", "POST", {
      warehouseId: ctx.warehouseId,
      toLocationId: ctx.loc1Id,
      responsibleUserId: ctx.userId,
      items: [{ productId: ctx.productId, quantity: qtyBefore, countedQuantity: -50 }],
    });
    const createRes = await POST(createReq);
    const { data: created } = await createRes.json();

    const confirmReq = createJsonRequest(
      `http://localhost:3000/api/operations/adjustments/${created.id}/confirm`,
      "POST",
    );
    const confirmRes = await confirmAdjustment(confirmReq, { params: Promise.resolve({ id: created.id }) });
    expect(confirmRes.status).toBe(400);

    const json = await confirmRes.json();
    expect(json.success).toBe(false);
    expect(json.message).toContain("below zero");
  });

  it("POST /api/operations/adjustments/:id/confirm - should reject confirming already DONE adjustment", async () => {
    const createReq = createJsonRequest("http://localhost:3000/api/operations/adjustments", "POST", {
      warehouseId: ctx.warehouseId,
      toLocationId: ctx.loc1Id,
      responsibleUserId: ctx.userId,
      items: [{ productId: ctx.productId, quantity: 10, countedQuantity: 10 }],
    });
    const createRes = await POST(createReq);
    const { data: created } = await createRes.json();

    const confirmReq1 = createJsonRequest(
      `http://localhost:3000/api/operations/adjustments/${created.id}/confirm`,
      "POST",
    );
    await confirmAdjustment(confirmReq1, { params: Promise.resolve({ id: created.id }) });

    // Second confirm -> 422
    const confirmReq2 = createJsonRequest(
      `http://localhost:3000/api/operations/adjustments/${created.id}/confirm`,
      "POST",
    );
    const confirmRes2 = await confirmAdjustment(confirmReq2, { params: Promise.resolve({ id: created.id }) });
    expect(confirmRes2.status).toBe(422);
  });

  it("PATCH /api/operations/adjustments/:id - should reject editing a DONE adjustment", async () => {
    const createReq = createJsonRequest("http://localhost:3000/api/operations/adjustments", "POST", {
      warehouseId: ctx.warehouseId,
      toLocationId: ctx.loc1Id,
      responsibleUserId: ctx.userId,
      items: [{ productId: ctx.productId, quantity: 10, countedQuantity: 10 }],
    });
    const createRes = await POST(createReq);
    const { data: created } = await createRes.json();

    const confirmReq = createJsonRequest(
      `http://localhost:3000/api/operations/adjustments/${created.id}/confirm`,
      "POST",
    );
    await confirmAdjustment(confirmReq, { params: Promise.resolve({ id: created.id }) });

    const patchReq = createJsonRequest(`http://localhost:3000/api/operations/adjustments/${created.id}`, "PATCH", {
      items: [{ productId: ctx.productId, quantity: 10, countedQuantity: 12 }],
    });
    const patchRes = await PATCH(patchReq, { params: Promise.resolve({ id: created.id }) });
    expect(patchRes.status).toBe(422);
  });

  it("POST /api/operations/adjustments/:id/confirm - should reject confirming a CANCELED adjustment", async () => {
    const createReq = createJsonRequest("http://localhost:3000/api/operations/adjustments", "POST", {
      warehouseId: ctx.warehouseId,
      toLocationId: ctx.loc1Id,
      responsibleUserId: ctx.userId,
      items: [{ productId: ctx.productId, quantity: 10, countedQuantity: 10 }],
    });
    const createRes = await POST(createReq);
    const { data: created } = await createRes.json();

    const cancelReq = createJsonRequest(`http://localhost:3000/api/operations/adjustments/${created.id}/cancel`, "POST");
    await cancelAdjustment(cancelReq, { params: Promise.resolve({ id: created.id }) });

    const confirmReq = createJsonRequest(
      `http://localhost:3000/api/operations/adjustments/${created.id}/confirm`,
      "POST",
    );
    const confirmRes = await confirmAdjustment(confirmReq, { params: Promise.resolve({ id: created.id }) });
    expect(confirmRes.status).toBe(422);
  });
});
