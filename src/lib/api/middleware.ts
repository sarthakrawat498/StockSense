import type { NextRequest, NextResponse } from "next/server";

import { getSessionUserFromRequest } from "@/lib/auth/session";
import type { AuthUser } from "@/types/auth.types";
import type { UserRole } from "@/types/common.types";

import { handleApiError, apiUnauthorized, apiForbidden } from "./response";

export interface WithAuthOptions {
  roles?: UserRole[];
}

export type AuthenticatedHandler<TContext = unknown> = (
  req: NextRequest,
  context: TContext,
  user: AuthUser
) => Promise<NextResponse> | NextResponse;

/**
 * Higher-order function that wraps a Next.js route handler with authentication & role checks.
 */
export function withAuth<TContext = unknown>(
  handler: AuthenticatedHandler<TContext>,
  options?: WithAuthOptions
) {
  return async (req: NextRequest, context: TContext): Promise<NextResponse> => {
    try {
      const user = await getSessionUserFromRequest(req);

      if (!user) {
        return apiUnauthorized("You must be logged in to access this resource.");
      }

      if (options?.roles && options.roles.length > 0) {
        if (!options.roles.includes(user.role)) {
          return apiForbidden("You do not have permission to access this resource.");
        }
      }

      return await handler(req, context, user);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
