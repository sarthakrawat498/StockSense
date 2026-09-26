import { NextRequest } from "next/server";
import { ConflictError, NotFoundError } from "@/lib/errors/app-error";
import type { Location, Warehouse } from "@/modules/warehouse";

const warehouseId = "225c9ea5-cce0-4c1d-83b2-4e6834e8d659";
const secondWarehouseId = "4f9d2d5b-43d8-4e88-8b2f-8ab9b4b5f901";
const locationId = "20312eea-175c-4f78-ae86-d6c0bf6eaa3a";
const missingId = "00000000-0000-0000-0000-000000000000";

const sampleWarehouse: Warehouse = {
  id: warehouseId,
  name: "North Distribution Center",
  code: "WH-NORTH",
  address: "12 Market Street",
  createdAt: "2026-09-26T00:00:00.000Z",
  updatedAt: "2026-09-26T00:00:00.000Z",
  locationCount: 2,
};

const sampleLocation: Location = {
  id: locationId,
  name: "Main Storage",
  code: "STORAGE",
  warehouseId,
  warehouseName: sampleWarehouse.name,
  createdAt: "2026-09-26T00:00:00.000Z",
  updatedAt: "2026-09-26T00:00:00.000Z",
};

var mockService: {
  list: jest.Mock;
  create: jest.Mock;
  getById: jest.Mock;
  update: jest.Mock;
  createLocation: jest.Mock;
  listLocationsByWarehouse: jest.Mock;
  getLocationById: jest.Mock;
  updateLocation: jest.Mock;
};

jest.mock("@/modules/warehouse", () => {
  mockService = {
    list: jest.fn(),
    create: jest.fn(),
    getById: jest.fn(),
    update: jest.fn(),
    createLocation: jest.fn(),
    listLocationsByWarehouse: jest.fn(),
    getLocationById: jest.fn(),
    updateLocation: jest.fn(),
  };
  return { WarehouseService: jest.fn(() => mockService) };
});

import { GET as listWarehouses, POST as createWarehouse } from "@/app/api/warehouses/route";
import {
  GET as getWarehouse,
  PATCH as updateWarehouse,
} from "@/app/api/warehouses/[id]/route";
import {
  GET as listLocations,
  POST as createLocation,
} from "@/app/api/warehouses/[id]/locations/route";
import {
  GET as getLocation,
  PATCH as updateLocation,
} from "@/app/api/locations/[id]/route";

type Context = { params: Promise<{ id: string }> };

const context = (id: string): Context => ({ params: Promise.resolve({ id }) });

function request(method: string, body?: unknown) {
  return new NextRequest("http://localhost/api/test", {
    method,
    ...(body === undefined ? {} : { body: typeof body === "string" ? body : JSON.stringify(body) }),
    headers: body === undefined ? undefined : { "content-type": "application/json" },
  });
}

async function json(response: Response) {
  return response.json();
}

describe("warehouse and location API routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockService.list.mockResolvedValue([sampleWarehouse]);
    mockService.create.mockResolvedValue(sampleWarehouse);
    mockService.getById.mockResolvedValue(sampleWarehouse);
    mockService.update.mockResolvedValue(sampleWarehouse);
    mockService.createLocation.mockResolvedValue(sampleLocation);
    mockService.listLocationsByWarehouse.mockResolvedValue([sampleLocation]);
    mockService.getLocationById.mockResolvedValue(sampleLocation);
    mockService.updateLocation.mockResolvedValue(sampleLocation);
  });

  describe("GET /api/warehouses", () => {
    it("returns the warehouse list", async () => {
      const response = await listWarehouses();
      expect(response.status).toBe(200);
      expect(await json(response)).toEqual({ success: true, data: [sampleWarehouse] });
      expect(mockService.list).toHaveBeenCalledTimes(1);
    });

    it("returns 500 when the service fails", async () => {
      mockService.list.mockRejectedValueOnce(new Error("database unavailable"));
      const response = await listWarehouses();
      expect(response.status).toBe(500);
      expect((await json(response)).success).toBe(false);
    });
  });

  describe("POST /api/warehouses", () => {
    it("creates a warehouse and returns 201", async () => {
      const response = await createWarehouse(request("POST", {
        name: "Central Warehouse",
        code: "WH-CENTRAL",
        address: "45 Industrial Road",
      }));
      expect(response.status).toBe(201);
      expect(mockService.create).toHaveBeenCalledWith({
        name: "Central Warehouse",
        code: "WH-CENTRAL",
        address: "45 Industrial Road",
      });
    });

    it.each([
      [{ name: "Missing code" }, "missing code"],
      [{ code: "MISSING-NAME" }, "missing name"],
      [{ name: "   ", code: "WH-EMPTY" }, "blank name"],
      [{ name: "Valid", code: "   " }, "blank code"],
      [{ name: "x".repeat(121), code: "WH-LONG" }, "long name"],
      [{ name: "Valid", code: "x".repeat(31) }, "long code"],
      [{ name: "Valid", code: "WH-EXTRA", extra: true }, "unknown field"],
      [{ name: null, code: "WH-NULL" }, "null name"],
    ])("returns 400 for %s", async (body, _label) => {
      const response = await createWarehouse(request("POST", body));
      expect(response.status).toBe(400);
      expect(mockService.create).not.toHaveBeenCalled();
    });

    it("returns 400 for malformed JSON", async () => {
      const response = await createWarehouse(request("POST", "{invalid"));
      expect(response.status).toBe(400);
      expect((await json(response)).message).toBe("Invalid JSON");
    });

    it("returns 409 for a duplicate warehouse", async () => {
      mockService.create.mockRejectedValueOnce(new ConflictError("Duplicate warehouse"));
      const response = await createWarehouse(request("POST", {
        name: sampleWarehouse.name,
        code: sampleWarehouse.code,
      }));
      expect(response.status).toBe(409);
    });
  });

  describe("GET /api/warehouses/:id", () => {
    it("returns a warehouse by UUID", async () => {
      const response = await getWarehouse(request("GET"), context(warehouseId));
      expect(response.status).toBe(200);
      expect(mockService.getById).toHaveBeenCalledWith(warehouseId);
    });

    it("returns 400 for malformed UUID", async () => {
      const response = await getWarehouse(request("GET"), context("not-a-uuid"));
      expect(response.status).toBe(400);
      expect(mockService.getById).not.toHaveBeenCalled();
    });

    it("returns 404 when the warehouse does not exist", async () => {
      mockService.getById.mockRejectedValueOnce(new NotFoundError("Warehouse not found"));
      const response = await getWarehouse(request("GET"), context(missingId));
      expect(response.status).toBe(404);
    });
  });

  describe("PATCH /api/warehouses/:id", () => {
    it("updates name and address", async () => {
      const response = await updateWarehouse(request("PATCH", {
        name: "North Hub",
        address: "Updated Address",
      }), context(warehouseId));
      expect(response.status).toBe(200);
      expect(mockService.update).toHaveBeenCalledWith(warehouseId, {
        name: "North Hub",
        address: "Updated Address",
      });
    });

    it.each([
      [{}, "empty body"],
      [{ name: "   " }, "blank name"],
      [{ code: "NEW-CODE" }, "immutable code"],
      [{ name: "Valid", extra: true }, "unknown field"],
    ])("returns 400 for %s", async (body, _label) => {
      const response = await updateWarehouse(request("PATCH", body), context(warehouseId));
      expect(response.status).toBe(400);
      expect(mockService.update).not.toHaveBeenCalled();
    });

    it("returns 400 for malformed JSON", async () => {
      const response = await updateWarehouse(request("PATCH", "{invalid"), context(warehouseId));
      expect(response.status).toBe(400);
    });

    it("returns 404 for an unknown warehouse", async () => {
      mockService.update.mockRejectedValueOnce(new NotFoundError("Warehouse not found"));
      const response = await updateWarehouse(request("PATCH", { name: "Missing" }), context(missingId));
      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/warehouses/:warehouseId/locations", () => {
    it("returns locations for a warehouse", async () => {
      const response = await listLocations(request("GET"), context(warehouseId));
      expect(response.status).toBe(200);
      expect(await json(response)).toEqual({ success: true, data: [sampleLocation] });
      expect(mockService.listLocationsByWarehouse).toHaveBeenCalledWith(warehouseId);
    });

    it("returns an empty list when the warehouse has no locations", async () => {
      mockService.listLocationsByWarehouse.mockResolvedValueOnce([]);
      const response = await listLocations(request("GET"), context(secondWarehouseId));
      expect(response.status).toBe(200);
      expect((await json(response)).data).toEqual([]);
    });

    it("returns 400 for an invalid warehouse UUID", async () => {
      const response = await listLocations(request("GET"), context("bad-id"));
      expect(response.status).toBe(400);
      expect(mockService.listLocationsByWarehouse).not.toHaveBeenCalled();
    });

    it("returns 404 for an unknown warehouse", async () => {
      mockService.listLocationsByWarehouse.mockRejectedValueOnce(new NotFoundError("Warehouse not found"));
      const response = await listLocations(request("GET"), context(missingId));
      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/warehouses/:warehouseId/locations", () => {
    it("creates a location and returns 201", async () => {
      const response = await createLocation(request("POST", {
        name: "Production Rack",
        code: "PRODUCTION-RACK",
      }), context(warehouseId));
      expect(response.status).toBe(201);
      expect(mockService.createLocation).toHaveBeenCalledWith(warehouseId, {
        name: "Production Rack",
        code: "PRODUCTION-RACK",
      });
    });

    it.each([
      [{ name: "Missing code" }, "missing code"],
      [{ code: "MISSING-NAME" }, "missing name"],
      [{ name: "   ", code: "EMPTY" }, "blank name"],
      [{ name: "Rack", code: "   " }, "blank code"],
      [{ name: "x".repeat(121), code: "LONG-NAME" }, "long name"],
      [{ name: "Rack", code: "x".repeat(31) }, "long code"],
      [{ name: "Rack", code: "RACK-A", parentId: "ignored" }, "unsupported hierarchy field"],
    ])("returns 400 for %s", async (body, _label) => {
      const response = await createLocation(request("POST", body), context(warehouseId));
      expect(response.status).toBe(400);
      expect(mockService.createLocation).not.toHaveBeenCalled();
    });

    it("returns 400 for malformed JSON", async () => {
      const response = await createLocation(request("POST", "{invalid"), context(warehouseId));
      expect(response.status).toBe(400);
    });

    it("returns 400 before the service for an invalid warehouse UUID", async () => {
      const response = await createLocation(request("POST", {
        name: "Rack A",
        code: "RACK-A",
      }), context("bad-id"));
      expect(response.status).toBe(400);
      expect(mockService.createLocation).not.toHaveBeenCalled();
    });

    it("returns 404 for an unknown warehouse", async () => {
      mockService.createLocation.mockRejectedValueOnce(new NotFoundError("Warehouse not found"));
      const response = await createLocation(request("POST", {
        name: "Rack A",
        code: "RACK-A",
      }), context(missingId));
      expect(response.status).toBe(404);
    });

    it("returns 409 for a duplicate code in the same warehouse", async () => {
      mockService.createLocation.mockRejectedValueOnce(new ConflictError("Duplicate location code"));
      const response = await createLocation(request("POST", {
        name: "Duplicate Storage",
        code: "STORAGE",
      }), context(warehouseId));
      expect(response.status).toBe(409);
    });
  });

  describe("GET /api/locations/:id", () => {
    it("returns a location by UUID", async () => {
      const response = await getLocation(request("GET"), context(locationId));
      expect(response.status).toBe(200);
      expect(mockService.getLocationById).toHaveBeenCalledWith(locationId);
    });

    it("returns 400 for an invalid location UUID", async () => {
      const response = await getLocation(request("GET"), context("bad-id"));
      expect(response.status).toBe(400);
      expect(mockService.getLocationById).not.toHaveBeenCalled();
    });

    it("returns 404 for an unknown location", async () => {
      mockService.getLocationById.mockRejectedValueOnce(new NotFoundError("Location not found"));
      const response = await getLocation(request("GET"), context(missingId));
      expect(response.status).toBe(404);
    });
  });

  describe("PATCH /api/locations/:id", () => {
    it("updates only the location name", async () => {
      const response = await updateLocation(request("PATCH", {
        name: "Production Rack Updated",
      }), context(locationId));
      expect(response.status).toBe(200);
      expect(mockService.updateLocation).toHaveBeenCalledWith(locationId, {
        name: "Production Rack Updated",
      });
    });

    it.each([
      [{}, "empty body"],
      [{ name: "   " }, "blank name"],
      [{ code: "NEW-CODE" }, "immutable code"],
      [{ name: "Rack", isActive: true }, "unsupported active flag"],
    ])("returns 400 for %s", async (body, _label) => {
      const response = await updateLocation(request("PATCH", body), context(locationId));
      expect(response.status).toBe(400);
      expect(mockService.updateLocation).not.toHaveBeenCalled();
    });

    it("returns 400 for malformed JSON", async () => {
      const response = await updateLocation(request("PATCH", "{invalid"), context(locationId));
      expect(response.status).toBe(400);
    });

    it("returns 404 for an unknown location", async () => {
      mockService.updateLocation.mockRejectedValueOnce(new NotFoundError("Location not found"));
      const response = await updateLocation(request("PATCH", { name: "Missing" }), context(missingId));
      expect(response.status).toBe(404);
    });
  });
});
