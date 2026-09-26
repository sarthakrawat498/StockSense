import type { NextRequest } from "next/server";

import { signupSchema } from "@/features/auth/schemas";
import { apiCreated, handleApiError } from "@/lib/api";
import { setAuthCookies } from "@/lib/auth";
import { authService } from "@/modules/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = signupSchema.parse(body);

    const result = await authService.signup(validated);

    const response = apiCreated(result.user, "User registered successfully");
    setAuthCookies(response, result.tokens);

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
