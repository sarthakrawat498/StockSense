import { NextRequest } from "next/server";
import { apiSuccess, apiCreated, apiError } from "@/lib/api/response";
import { ReceiptService } from "@/modules/receipt";
import type { OperationStatus } from "@/types/common.types";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const filters = {
      warehouseId: searchParams.get("warehouseId") || undefined,
      status: (searchParams.get("status") as OperationStatus) || undefined,
      search: searchParams.get("search") || undefined,
      page: searchParams.has("page") ? parseInt(searchParams.get("page")!, 10) : undefined,
      pageSize: searchParams.has("pageSize") ? parseInt(searchParams.get("pageSize")!, 10) : undefined,
    };
    const result = await ReceiptService.list(filters);
    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await ReceiptService.create(body);
    return apiCreated(result);
  } catch (error) {
    return apiError(error);
  }
}
