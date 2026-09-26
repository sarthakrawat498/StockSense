import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { ReceiptService } from "@/modules/receipt";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = await ReceiptService.cancel(id);
    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}
