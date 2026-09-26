import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { DeliveryService } from "@/modules/delivery";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = await DeliveryService.getById(id);
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
    const result = await DeliveryService.update(id, body);
    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}
