import { GET, POST } from "@/app/api/operations/deliveries/route";
import { GET as getById, PATCH } from "@/app/api/operations/deliveries/[id]/route";
import { POST as confirmDelivery } from "@/app/api/operations/deliveries/[id]/confirm/route";
import { POST as cancelDelivery } from "@/app/api/operations/deliveries/[id]/cancel/route";
import { POST as createReceipt } from "@/app/api/operations/receipts/route";
import { POST as confirmReceipt } from "@/app/api/operations/receipts/[id]/confirm/route";
import { prisma } from "@/lib/db";
import { getTestContext, createJsonRequest, TestContext } from "./helpers/test-context";

describe("Deliveries API Endpoints", () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await getTestContext();

    // Ensure stock exists in loc1 for delivery tests (add 100 units via receipt)
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

  it("POST /api/operations/deliveries - should create delivery in DRAFT status", async () => {
    const payload = {
      warehouseId: ctx.warehouseId,
      fromLocationId: ctx.loc1Id,
      contactName: "Jest Delivery Customer",
      address: "200 Consumer Way",
      responsibleUserId: ctx.userId,
      items: [{ productId: ctx.productId, quantity: 5 }],
    };

    const req = createJsonRequest("http://localhost:3000/api/operations/deliveries", "POST", payload);
    const res = await POST(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.status).toBe("DRAFT");
    expect(json.data.type).toBe("DELIVERY");
    expect(json.data.fromLocationId).toBe(ctx.loc1Id);
  });

  it("GET /api/operations/deliveries - should list deliveries with pagination", async () => {
    const req = createJsonRequest("http://localhost:3000/api/operations/deliveries?page=1&pageSize=10", "GET");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data.items)).toBe(true);
  });

  it("GET /api/operations/deliveries/:id - should get delivery details by ID", async () => {
    const createReq = createJsonRequest("http://localhost:3000/api/operations/deliveries", "POST", {
      warehouseId: ctx.warehouseId,
      fromLocationId: ctx.loc1Id,
      responsibleUserId: ctx.userId,
      items: [{ productId: ctx.productId, quantity: 5 }],
    });
    const createRes = await POST(createReq);
    const { data: created } = await createRes.json();

    const req = createJsonRequest(`http://localhost:3000/api/operations/deliveries/${created.id}`, "GET");
    const res = await getById(req, { params: Promise.resolve({ id: created.id }) });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.id).toBe(created.id);
  });

  it("PATCH /api/operations/deliveries/:id - should update DRAFT delivery fields", async () => {
    const createReq = createJsonRequest("http://localhost:3000/api/operations/deliveries", "POST", {
      warehouseId: ctx.warehouseId,
      fromLocationId: ctx.loc1Id,
      contactName: "Old Contact",
      responsibleUserId: ctx.userId,
      items: [{ productId: ctx.productId, quantity: 5 }],
    });
    const createRes = await POST(createReq);
    const { data: created } = await createRes.json();

    const patchReq = createJsonRequest(`http://localhost:3000/api/operations/deliveries/${created.id}`, "PATCH", {
      contactName: "New Contact Co",
    });
    const patchRes = await PATCH(patchReq, { params: Promise.resolve({ id: created.id }) });
    expect(patchRes.status).toBe(200);

    const json = await patchRes.json();
    expect(json.success).toBe(true);
    expect(json.data.contactName).toBe("New Contact Co");
  });

  it("POST /api/operations/deliveries/:id/confirm - should confirm delivery, decrement stock, and add ledger", async () => {
    const balanceBefore = await prisma.stockBalance.findUnique({
      where: { productId_locationId: { productId: ctx.productId, locationId: ctx.loc1Id } },
    });
    const qtyBefore = Number(balanceBefore?.onHandQty ?? 0);

    const createReq = createJsonRequest("http://localhost:3000/api/operations/deliveries", "POST", {
      warehouseId: ctx.warehouseId,
      fromLocationId: ctx.loc1Id,
      responsibleUserId: ctx.userId,
      items: [{ productId: ctx.productId, quantity: 12 }],
    });
    const createRes = await POST(createReq);
    const { data: created } = await createRes.json();

    const confirmReq = createJsonRequest(
      `http://localhost:3000/api/operations/deliveries/${created.id}/confirm`,
      "POST",
      { performedById: ctx.userId },
    );
    const confirmRes = await confirmDelivery(confirmReq, { params: Promise.resolve({ id: created.id }) });
    expect(confirmRes.status).toBe(200);

    const json = await confirmRes.json();
    expect(json.success).toBe(true);
    expect(json.data.status).toBe("DONE");

    // Stock balance decreased by 12
    const balanceAfter = await prisma.stockBalance.findUnique({
      where: { productId_locationId: { productId: ctx.productId, locationId: ctx.loc1Id } },
    });
    expect(Number(balanceAfter?.onHandQty)).toBe(qtyBefore - 12);

    // Ledger entry created
    const ledger = await prisma.stockLedger.findFirst({
      where: { operationId: created.id },
    });
    expect(ledger?.movementType).toBe("DELIVERY");
    expect(Number(ledger?.quantity)).toBe(12);
  });

  it("POST /api/operations/deliveries/:id/confirm - should reject confirmation when stock is insufficient", async () => {
    // Attempt to deliver huge quantity that exceeds stock
    const createReq = createJsonRequest("http://localhost:3000/api/operations/deliveries", "POST", {
      warehouseId: ctx.warehouseId,
      fromLocationId: ctx.loc1Id,
      responsibleUserId: ctx.userId,
      items: [{ productId: ctx.productId, quantity: 999999 }],
    });
    const createRes = await POST(createReq);
    const { data: created } = await createRes.json();

    const confirmReq = createJsonRequest(
      `http://localhost:3000/api/operations/deliveries/${created.id}/confirm`,
      "POST",
    );
    const confirmRes = await confirmDelivery(confirmReq, { params: Promise.resolve({ id: created.id }) });
    expect(confirmRes.status).toBe(422);

    const json = await confirmRes.json();
    expect(json.success).toBe(false);
    expect(json.message).toContain("Insufficient stock");
  });

  it("POST /api/operations/deliveries/:id/cancel - should cancel a DRAFT delivery", async () => {
    const createReq = createJsonRequest("http://localhost:3000/api/operations/deliveries", "POST", {
      warehouseId: ctx.warehouseId,
      fromLocationId: ctx.loc1Id,
      responsibleUserId: ctx.userId,
      items: [{ productId: ctx.productId, quantity: 2 }],
    });
    const createRes = await POST(createReq);
    const { data: created } = await createRes.json();

    const cancelReq = createJsonRequest(`http://localhost:3000/api/operations/deliveries/${created.id}/cancel`, "POST");
    const cancelRes = await cancelDelivery(cancelReq, { params: Promise.resolve({ id: created.id }) });
    expect(cancelRes.status).toBe(200);

    const json = await cancelRes.json();
    expect(json.success).toBe(true);
    expect(json.data.status).toBe("CANCELED");
  });

  it("POST /api/operations/deliveries/:id/confirm - should reject confirming already DONE delivery", async () => {
    const createReq = createJsonRequest("http://localhost:3000/api/operations/deliveries", "POST", {
      warehouseId: ctx.warehouseId,
      fromLocationId: ctx.loc1Id,
      responsibleUserId: ctx.userId,
      items: [{ productId: ctx.productId, quantity: 1 }],
    });
    const createRes = await POST(createReq);
    const { data: created } = await createRes.json();

    const confirmReq1 = createJsonRequest(
      `http://localhost:3000/api/operations/deliveries/${created.id}/confirm`,
      "POST",
    );
    await confirmDelivery(confirmReq1, { params: Promise.resolve({ id: created.id }) });

    // Second confirm -> 422
    const confirmReq2 = createJsonRequest(
      `http://localhost:3000/api/operations/deliveries/${created.id}/confirm`,
      "POST",
    );
    const confirmRes2 = await confirmDelivery(confirmReq2, { params: Promise.resolve({ id: created.id }) });
    expect(confirmRes2.status).toBe(422);
  });

  it("PATCH /api/operations/deliveries/:id - should reject editing a DONE delivery", async () => {
    const createReq = createJsonRequest("http://localhost:3000/api/operations/deliveries", "POST", {
      warehouseId: ctx.warehouseId,
      fromLocationId: ctx.loc1Id,
      responsibleUserId: ctx.userId,
      items: [{ productId: ctx.productId, quantity: 1 }],
    });
    const createRes = await POST(createReq);
    const { data: created } = await createRes.json();

    const confirmReq = createJsonRequest(
      `http://localhost:3000/api/operations/deliveries/${created.id}/confirm`,
      "POST",
    );
    await confirmDelivery(confirmReq, { params: Promise.resolve({ id: created.id }) });

    const patchReq = createJsonRequest(`http://localhost:3000/api/operations/deliveries/${created.id}`, "PATCH", {
      contactName: "Changed After DONE",
    });
    const patchRes = await PATCH(patchReq, { params: Promise.resolve({ id: created.id }) });
    expect(patchRes.status).toBe(422);
  });

  it("POST /api/operations/deliveries/:id/confirm - should reject confirming a CANCELED delivery", async () => {
    const createReq = createJsonRequest("http://localhost:3000/api/operations/deliveries", "POST", {
      warehouseId: ctx.warehouseId,
      fromLocationId: ctx.loc1Id,
      responsibleUserId: ctx.userId,
      items: [{ productId: ctx.productId, quantity: 1 }],
    });
    const createRes = await POST(createReq);
    const { data: created } = await createRes.json();

    const cancelReq = createJsonRequest(`http://localhost:3000/api/operations/deliveries/${created.id}/cancel`, "POST");
    await cancelDelivery(cancelReq, { params: Promise.resolve({ id: created.id }) });

    const confirmReq = createJsonRequest(
      `http://localhost:3000/api/operations/deliveries/${created.id}/confirm`,
      "POST",
    );
    const confirmRes = await confirmDelivery(confirmReq, { params: Promise.resolve({ id: created.id }) });
    expect(confirmRes.status).toBe(422);
  });
});
