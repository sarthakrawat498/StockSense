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

export interface RequestOptions {
  token?: string;
  refreshToken?: string;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
}

export function createJsonRequest(
  url: string,
  method: string,
  body?: unknown,
  options?: RequestOptions
) {
  const headers: Record<string, string> = {
    ...(options?.headers ?? {}),
  };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (options?.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  const req = new NextRequest(new URL(url, "http://localhost:3000"), {
    method,
    headers,
    body: body !== undefined ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
  });

  if (options?.token) {
    req.cookies.set("access_token", options.token);
  }
  if (options?.refreshToken) {
    req.cookies.set("refresh_token", options.refreshToken);
  }
  if (options?.cookies) {
    for (const [k, v] of Object.entries(options.cookies)) {
      req.cookies.set(k, v);
    }
  }

  return req;
}

export function routeContext(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
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
