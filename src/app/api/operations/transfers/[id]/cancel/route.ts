import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { TransferService } from "@/modules/transfer";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = await TransferService.cancel(id);
    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}
