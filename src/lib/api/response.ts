import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import { AppError } from "@/lib/errors";
import type { ApiResponse, ApiError } from "@/types/api.types";

export type { ApiResponse, ApiError };

/**
 * Standard successful response.
 * Accepts either:
 * - apiSuccess(data, "Created/Updated message", 200)
 * - apiSuccess(data, 200)
 * - apiSuccess(data)
 */
export function apiSuccess<T>(
  data: T,
  messageOrStatus?: string | number,
  status = 200
): NextResponse<ApiResponse<T>> {
  let message: string | undefined;
  let statusCode = status;

  if (typeof messageOrStatus === "number") {
    statusCode = messageOrStatus;
  } else if (typeof messageOrStatus === "string") {
    message = messageOrStatus;
  }

  return NextResponse.json(
    {
      success: true,
      data,
      ...(message ? { message } : {}),
    },
    { status: statusCode }
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
    return NextResponse.json(
      {
        success: false,
        message: error.message,
        ...(error.code ? { code: error.code } : {}),
        ...(error.errors && error.errors.length > 0 ? { errors: error.errors } : {}),
      },
      { status: error.statusCode }
    );
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

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  ) {
    return apiConflict("A record with that value already exists");
  }

  console.error("[Unhandled API Error]:", error);
  return NextResponse.json(
    {
      success: false,
      message: "Internal server error",
      code: "INTERNAL_SERVER_ERROR",
    },
    { status: 500 }
  );
}

/**
 * Standard error response.
 * Handles both:
 * - apiError(error) where error is an unknown caught exception
 * - apiError(message, status, errors, code)
 */
export function apiError(
  errorOrMessage: unknown,
  status = 400,
  errors?: ApiError[],
  code?: string
): NextResponse<ApiResponse<null>> {
  if (typeof errorOrMessage === "string") {
    return NextResponse.json(
      {
        success: false,
        message: errorOrMessage,
        ...(errors && errors.length > 0 ? { errors } : {}),
        ...(code ? { code } : {}),
      },
      { status }
    );
  }

  return handleApiError(errorOrMessage);
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
