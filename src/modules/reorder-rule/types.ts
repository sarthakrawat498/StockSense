import type { PaginatedResponse } from "@/types/api.types";
import type { ReorderRule } from "@/modules/product";

export type { ReorderRule };

export interface CreateReorderRuleParams {
	productId: string;
	minQty: string;
	maxQty: string;
	isActive?: boolean;
}

export interface UpdateReorderRuleParams {
	minQty?: string;
	maxQty?: string;
	isActive?: boolean;
}

export interface ReorderRuleFilters {
	isActive?: boolean;
	page?: number;
	pageSize?: number;
}

export type ReorderRuleList = PaginatedResponse<ReorderRule>;
