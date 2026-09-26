import type { NextRequest } from "next/server";

import { apiSuccess, apiUnauthorized, handleApiError } from "@/lib/api";
import { setAuthCookies, REFRESH_TOKEN_COOKIE } from "@/lib/auth";
import { authService } from "@/modules/auth";

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

    if (!refreshToken) {
      return apiUnauthorized("Refresh token missing.");
    }

    const tokens = await authService.refreshTokens(refreshToken);

    const response = apiSuccess(null, "Token refreshed successfully");
    setAuthCookies(response, tokens);

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
