import { API } from "@/constants/api-endpoints";
import { httpClient } from "@/lib/http/client";
import type { Category } from "@/modules/category";

export const categoriesService = {
	list: () => httpClient.get<Category[]>(API.CATEGORIES.BASE),
	getById: (id: string) => httpClient.get<Category>(API.CATEGORIES.BY_ID(id)),
	create: (input: { name: string }) => httpClient.post<Category>(API.CATEGORIES.BASE, input),
	update: (id: string, input: { name: string }) => httpClient.patch<Category>(API.CATEGORIES.BY_ID(id), input),
};
