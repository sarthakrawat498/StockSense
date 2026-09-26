import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors/app-error";

// ─── Response Shape ──────────────────────────────────────────────────────────

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{ field?: string; message: string }>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiCreated<T>(data: T): NextResponse<ApiResponse<T>> {
  return apiSuccess(data, 201);
}

export function apiError(error: unknown): NextResponse<ApiResponse<never>> {
  if (error instanceof AppError) {
    return NextResponse.json(
      { success: false, message: error.message, code: error.code },
      { status: error.statusCode },
    );
  }

  // Prisma known-request errors (unique constraint violations, etc.)
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  ) {
    return NextResponse.json(
      { success: false, message: "A record with that value already exists" },
      { status: 409 },
    );
  }

  console.error("Unhandled error:", error);
  return NextResponse.json(
    { success: false, message: "Internal server error" },
    { status: 500 },
  );
}
