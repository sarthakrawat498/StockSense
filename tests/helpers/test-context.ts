import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export interface TestContext {
  userId: string;
  warehouseId: string;
  loc1Id: string;
  loc2Id: string;
  productId: string;
  productName: string;
}

export function createJsonRequest(url: string, method: string, body?: unknown) {
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function getTestContext(): Promise<TestContext> {
  const user = await prisma.user.findFirstOrThrow();
  const warehouses = await prisma.warehouse.findMany({
    include: { locations: true },
  });
  const warehouse = warehouses.find((w) => w.locations.length >= 2) || warehouses[0];
  if (!warehouse || warehouse.locations.length < 2) {
    throw new Error("Warehouse with at least 2 locations required for tests");
  }

  const [loc1, loc2] = warehouse.locations;
  const product = await prisma.product.findFirstOrThrow();

  return {
    userId: user.id,
    warehouseId: warehouse.id,
    loc1Id: loc1.id,
    loc2Id: loc2.id,
    productId: product.id,
    productName: product.name,
  };
}
