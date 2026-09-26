import type { Timestamps } from "@/types/common.types";

export interface Category extends Timestamps {
	id: string;
	name: string;
}

export interface CreateCategoryParams {
	name: string;
}

export interface UpdateCategoryParams {
	name?: string;
}
