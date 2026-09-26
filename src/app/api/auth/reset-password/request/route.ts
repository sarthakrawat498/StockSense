import type { NextRequest } from "next/server";

import { requestPasswordResetSchema } from "@/features/auth/schemas";
import { apiSuccess, handleApiError } from "@/lib/api";
import { authService } from "@/modules/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = requestPasswordResetSchema.parse(body);

    const result = await authService.requestPasswordReset(validated);

    return apiSuccess(null, result.message);
  } catch (error) {
    return handleApiError(error);
  }
}
