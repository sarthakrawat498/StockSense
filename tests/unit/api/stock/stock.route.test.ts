import { NextRequest } from "next/server";
import { NotFoundError } from "@/lib/errors/app-error";
import type { PaginatedStockResponse, StockBalanceRow } from "@/modules/stock-ledger";

const productId = "11111111-1111-4111-8111-111111111111";
const warehouseId = "22222222-2222-4222-8222-222222222222";
const locationId = "33333333-3333-4333-8333-333333333333";
const categoryId = "44444444-4444-4444-8444-444444444444";
const missingId = "00000000-0000-0000-0000-000000000000";

const row: StockBalanceRow = {
	id: "55555555-5555-4555-8555-555555555555",
	productId,
	productName: "Warehouse Laptop",
	sku: "ELEC-LAP-001",
	categoryId,
	categoryName: "Electronics",
	warehouseId,
	warehouseName: "North Distribution Center",
	locationId,
	locationName: "Main Storage",
	onHandQty: 18,
	reservedQty: 2,
	freeQty: 16,
	reorderPoint: 5,
	isLowStock: false,
};

var mockService: { list: jest.Mock; getByLocation: jest.Mock };
jest.mock("@/modules/stock-ledger", () => {
	mockService = { list: jest.fn(), getByLocation: jest.fn() };
	return { StockReadService: jest.fn(() => mockService) };
});

import { GET as getStock } from "@/app/api/stock/route";
import { GET as getLocationStock } from "@/app/api/locations/[id]/stock/route";

const page: PaginatedStockResponse = { items: [row], total: 1, page: 1, pageSize: 20, totalPages: 1 };
const context = (id: string) => ({ params: Promise.resolve({ id }) });

function request(query = "") {
	return new NextRequest(`http://localhost/api/stock${query}`);
}

async function body(response: Response) { return response.json(); }

describe("stock read APIs", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockService.list.mockResolvedValue(page);
		mockService.getByLocation.mockResolvedValue([row]);
	});

	it("lists stock balances", async () => {
		const response = await getStock(request());
		expect(response.status).toBe(200);
		expect((await body(response)).data).toEqual(page);
	});

	it("passes all supported filters to the service", async () => {
		await getStock(request(`?productId=${productId}&warehouseId=${warehouseId}&locationId=${locationId}&categoryId=${categoryId}&search=laptop&lowStock=true&page=2&pageSize=10`));
		expect(mockService.list).toHaveBeenCalledWith({ productId, warehouseId, locationId, categoryId, search: "laptop", lowStock: true, page: 2, pageSize: 10 });
	});

	it.each([
		"?productId=bad",
		"?warehouseId=bad",
		"?locationId=bad",
		"?categoryId=bad",
		"?lowStock=maybe",
		"?page=0",
		"?pageSize=101",
	])("rejects invalid query %s", async (query) => {
		const response = await getStock(request(query));
		expect(response.status).toBe(400);
		expect(mockService.list).not.toHaveBeenCalled();
	});

	it("returns 500 when global stock lookup fails", async () => {
		mockService.list.mockRejectedValueOnce(new Error("database unavailable"));
		const response = await getStock(request());
		expect(response.status).toBe(500);
	});

	it("returns stock for a location", async () => {
		const response = await getLocationStock(request(), context(locationId));
		expect(response.status).toBe(200);
		expect((await body(response)).data).toEqual([row]);
		expect(mockService.getByLocation).toHaveBeenCalledWith(locationId);
	});

	it("rejects an invalid location UUID", async () => {
		const response = await getLocationStock(request(), context("bad-id"));
		expect(response.status).toBe(400);
		expect(mockService.getByLocation).not.toHaveBeenCalled();
	});

	it("returns 404 for an unknown location", async () => {
		mockService.getByLocation.mockRejectedValueOnce(new NotFoundError("Location not found"));
		const response = await getLocationStock(request(), context(missingId));
		expect(response.status).toBe(404);
	});
});
