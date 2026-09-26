import { NextRequest } from "next/server";
import { ConflictError, NotFoundError } from "@/lib/errors/app-error";
import type { Category } from "@/modules/category";

const categoryId = "3c7f6f13-7c4c-4b32-a768-1b0c8f899101";
const missingId = "00000000-0000-0000-0000-000000000000";

const sampleCategory: Category = {
	id: categoryId,
	name: "Electronics",
	createdAt: "2026-09-26T00:00:00.000Z",
	updatedAt: "2026-09-26T00:00:00.000Z",
};

const service = {
	list: jest.fn(),
	create: jest.fn(),
	getById: jest.fn(),
	update: jest.fn(),
};

jest.mock("@/modules/category", () => ({
	CategoryService: jest.fn(() => service),
}));

import { GET as listCategories, POST as createCategory } from "@/app/api/categories/route";
import { GET as getCategory, PATCH as updateCategory } from "@/app/api/categories/[id]/route";

type Context = { params: Promise<{ id: string }> };
const context = (id: string): Context => ({ params: Promise.resolve({ id }) });

function request(method: string, body?: unknown) {
	return new NextRequest("http://localhost/api/categories", {
		method,
		...(body === undefined ? {} : { body: typeof body === "string" ? body : JSON.stringify(body) }),
		headers: body === undefined ? undefined : { "content-type": "application/json" },
	});
}

async function json(response: Response) {
	return response.json();
}

describe("category API routes", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		service.list.mockResolvedValue([sampleCategory]);
		service.create.mockResolvedValue(sampleCategory);
		service.getById.mockResolvedValue(sampleCategory);
		service.update.mockResolvedValue(sampleCategory);
	});

	it("GET /api/categories returns categories", async () => {
		const response = await listCategories();
		expect(response.status).toBe(200);
		expect((await json(response)).data).toEqual([sampleCategory]);
	});

	it("GET /api/categories returns 500 on service failure", async () => {
		service.list.mockRejectedValueOnce(new Error("database unavailable"));
		const response = await listCategories();
		expect(response.status).toBe(500);
	});

	it("POST /api/categories creates a category", async () => {
		const response = await createCategory(request("POST", { name: "Packaging" }));
		expect(response.status).toBe(201);
		expect(service.create).toHaveBeenCalledWith({ name: "Packaging" });
	});

	it.each([
		[{}, "missing name"],
		[{ name: "" }, "empty name"],
		[{ name: "   " }, "blank name"],
		[{ name: "x".repeat(101) }, "long name"],
		[{ name: null }, "null name"],
		[{ name: "Packaging", extra: true }, "unknown field"],
	])("POST rejects %s", async (body, _label) => {
		const response = await createCategory(request("POST", body));
		expect(response.status).toBe(400);
		expect(service.create).not.toHaveBeenCalled();
	});

	it("POST returns 400 for malformed JSON", async () => {
		const response = await createCategory(request("POST", "{invalid"));
		expect(response.status).toBe(400);
	});

	it("POST returns 409 for duplicate category name", async () => {
		service.create.mockRejectedValueOnce(new ConflictError("Duplicate category"));
		const response = await createCategory(request("POST", { name: "Electronics" }));
		expect(response.status).toBe(409);
	});

	it("GET /api/categories/:id returns a category", async () => {
		const response = await getCategory(request("GET"), context(categoryId));
		expect(response.status).toBe(200);
		expect(service.getById).toHaveBeenCalledWith(categoryId);
	});

	it("GET /api/categories/:id rejects invalid UUID", async () => {
		const response = await getCategory(request("GET"), context("not-a-uuid"));
		expect(response.status).toBe(400);
		expect(service.getById).not.toHaveBeenCalled();
	});

	it("GET /api/categories/:id returns 404 when missing", async () => {
		service.getById.mockRejectedValueOnce(new NotFoundError("Category not found"));
		const response = await getCategory(request("GET"), context(missingId));
		expect(response.status).toBe(404);
	});

	it("PATCH /api/categories/:id updates the name", async () => {
		const response = await updateCategory(request("PATCH", { name: "Consumables" }), context(categoryId));
		expect(response.status).toBe(200);
		expect(service.update).toHaveBeenCalledWith(categoryId, { name: "Consumables" });
	});

	it.each([
		[{}, "empty body"],
		[{ name: "" }, "empty name"],
		[{ name: "   " }, "blank name"],
		[{ name: "x".repeat(101) }, "long name"],
		[{ name: "Category", extra: true }, "unknown field"],
	])("PATCH rejects %s", async (body, _label) => {
		const response = await updateCategory(request("PATCH", body), context(categoryId));
		expect(response.status).toBe(400);
		expect(service.update).not.toHaveBeenCalled();
	});

	it("PATCH returns 400 for malformed JSON", async () => {
		const response = await updateCategory(request("PATCH", "{invalid"), context(categoryId));
		expect(response.status).toBe(400);
	});

	it("PATCH returns 404 when category is missing", async () => {
		service.update.mockRejectedValueOnce(new NotFoundError("Category not found"));
		const response = await updateCategory(request("PATCH", { name: "Missing" }), context(missingId));
		expect(response.status).toBe(404);
	});

	it("PATCH returns 409 for duplicate category name", async () => {
		service.update.mockRejectedValueOnce(new ConflictError("Duplicate category"));
		const response = await updateCategory(request("PATCH", { name: "Packaging" }), context(categoryId));
		expect(response.status).toBe(409);
	});
});
