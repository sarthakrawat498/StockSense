import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import { AppError } from "@/lib/errors";
import type { ApiResponse, ApiError } from "@/types/api.types";

export type { ApiResponse, ApiError };

/**
 * Standard successful response.
 * Supports:
 * - apiSuccess(data, status, message)
 * - apiSuccess(data, message, status)
 * - apiSuccess(data, status)
 * - apiSuccess(data)
 */
export function apiSuccess<T>(
  data: T,
  messageOrStatus?: string | number,
  statusOrMessage?: number | string
): NextResponse<ApiResponse<T>> {
  let message: string | undefined;
  let statusCode = 200;

  if (typeof messageOrStatus === "number") {
    statusCode = messageOrStatus;
    if (typeof statusOrMessage === "string") {
      message = statusOrMessage;
    }
  } else if (typeof messageOrStatus === "string") {
    message = messageOrStatus;
    if (typeof statusOrMessage === "number") {
      statusCode = statusOrMessage;
    }
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
  return apiSuccess(data, 201, message);
}

/**
 * Extracts and formats error responses from thrown exceptions.
 */
export function apiErrorFromException(error: unknown): NextResponse<ApiResponse<null>> {
  if (error instanceof ZodError) {
    const formattedErrors: ApiError[] = error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
      code: err.code,
    }));

    return NextResponse.json(
      {
        success: false,
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        errors: formattedErrors,
      },
      { status: 422 }
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
        code: error.code,
        errors: error.errors ?? (error.code ? [{ code: error.code, message: error.message }] : undefined),
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

  if (
    error instanceof SyntaxError ||
    (typeof error === "object" && error !== null && "name" in error && error.name === "SyntaxError")
  ) {
    return apiError("Invalid JSON", 400);
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

/** Universal error handler alias */
export const handleApiError = apiErrorFromException;

/**
 * Standard error response.
 * Handles both:
 * - apiError(error) where error is an unknown caught exception
 * - apiError(message, status?, errors?, code?)
 */
export function apiError(message: string, status?: number, errors?: ApiError[], code?: string): NextResponse<ApiResponse<null>>;
export function apiError(error: unknown): NextResponse<ApiResponse<null>>;
export function apiError(
  first: unknown,
  status = 500,
  errors?: ApiError[],
  code?: string
): NextResponse<ApiResponse<null>> {
  if (typeof first !== "string") {
    return apiErrorFromException(first);
  }

  return NextResponse.json(
    {
      success: false,
      message: first,
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

export function apiValidationError(
  errors: ApiError[] | string
): NextResponse<ApiResponse<null>> {
  return apiError(
    "Validation failed",
    400,
    typeof errors === "string" ? [{ message: errors }] : errors,
    "VALIDATION_ERROR"
  );
}
