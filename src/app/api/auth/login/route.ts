import type { NextRequest } from "next/server";

import { loginSchema } from "@/features/auth/schemas";
import { apiSuccess, handleApiError } from "@/lib/api";
import { setAuthCookies } from "@/lib/auth";
import { authService } from "@/modules/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = loginSchema.parse(body);

    const result = await authService.login(validated);

    const response = apiSuccess(result.user, "Logged in successfully");
    setAuthCookies(response, result.tokens);

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
