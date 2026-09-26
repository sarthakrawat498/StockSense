import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { ReceiptService } from "@/modules/receipt";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const performedById = body.performedById || body.responsibleUserId;
    const result = await ReceiptService.confirm(id, performedById);
    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}
