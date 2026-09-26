import { API } from "@/constants/api-endpoints";
import { httpClient } from "@/lib/http/client";
import type { PaginatedResponse } from "@/types/api.types";
import type { CreateProductParams, Product, ProductFilters, ProductStock, UpdateProductParams } from "@/modules/product";

function queryString(filters: ProductFilters = {}) {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(filters)) if (value !== undefined && value !== "") params.set(key, String(value));
	const query = params.toString();
	return query ? `?${query}` : "";
}

export const productsService = {
	list: (filters: ProductFilters = {}) => httpClient.get<PaginatedResponse<Product>>(`${API.PRODUCTS.BASE}${queryString(filters)}`),
	getById: (id: string) => httpClient.get<Product>(API.PRODUCTS.BY_ID(id)),
	create: (input: CreateProductParams) => httpClient.post<Product>(API.PRODUCTS.BASE, input),
	update: (id: string, input: UpdateProductParams) => httpClient.patch<Product>(API.PRODUCTS.BY_ID(id), input),
	getStock: (id: string) => httpClient.get<ProductStock>(API.PRODUCTS.STOCK(id)),
};
