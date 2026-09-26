import { NextResponse } from "next/server";

import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import { AppError } from "@/lib/errors";
import type { ApiResponse, ApiError } from "@/types/api.types";

/**
 * Standard successful response.
 */
export function apiSuccess<T>(
  data: T,
  message?: string,
  status = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message ? { message } : {}),
    },
    { status }
  );
}

/**
 * Standard created (201) response.
 */
export function apiCreated<T>(
  data: T,
  message = "Created successfully"
): NextResponse<ApiResponse<T>> {
  return apiSuccess(data, message, 201);
}

/**
 * Standard error response.
 */
export function apiError(
  message: string,
  status = 400,
  errors?: ApiError[],
  code?: string
): NextResponse<ApiResponse<null>> {
  return NextResponse.json(
    {
      success: false,
      message,
      ...(errors && errors.length > 0 ? { errors } : {}),
      ...(code ? { code } : {}),
    },
    { status }
  );
}

export function apiUnauthorized(
  message = "Unauthorized",
  code = "UNAUTHORIZED"
): NextResponse<ApiResponse<null>> {
  return apiError(message, 401, undefined, code);
}

export function apiForbidden(
  message = "Forbidden",
  code = "FORBIDDEN"
): NextResponse<ApiResponse<null>> {
  return apiError(message, 403, undefined, code);
}

export function apiNotFound(
  message = "Resource not found",
  code = "NOT_FOUND"
): NextResponse<ApiResponse<null>> {
  return apiError(message, 404, undefined, code);
}

export function apiConflict(
  message = "Resource already exists",
  code = "CONFLICT"
): NextResponse<ApiResponse<null>> {
  return apiError(message, 409, undefined, code);
}

/**
 * Universal error handler for route handlers.
 */
export function handleApiError(error: unknown): NextResponse<ApiResponse<null>> {
  if (error instanceof ZodError) {
    const formattedErrors: ApiError[] = error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
      code: err.code,
    }));

    return apiError("Validation failed", 422, formattedErrors, "VALIDATION_ERROR");
  }

  if (error instanceof AppError) {
    return apiError(error.message, error.statusCode, error.errors, error.code);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = Array.isArray(error.meta?.target)
        ? error.meta?.target.join(", ")
        : (error.meta?.target as string) || "resource";
      return apiConflict(`A record with this ${target} already exists.`);
    }

    if (error.code === "P2025") {
      return apiNotFound("The requested record was not found.");
    }
  }

  console.error("[Unhandled API Error]:", error);
  return apiError("An unexpected internal error occurred.", 500, undefined, "INTERNAL_SERVER_ERROR");
}
