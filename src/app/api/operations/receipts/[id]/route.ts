import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { ReceiptService } from "@/modules/receipt";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = await ReceiptService.getById(id);
    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const result = await ReceiptService.update(id, body);
    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}
