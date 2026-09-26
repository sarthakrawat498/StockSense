import { NextResponse } from "next/server";
import type { ApiError, ApiResponse } from "@/types/api.types";
import { AppError } from "@/lib/errors/app-error";

export function apiSuccess<T>(data: T, status = 200, message?: string) {
	const body: ApiResponse<T> = { success: true, data, ...(message ? { message } : {}) };
	return NextResponse.json(body, { status });
}

export function apiCreated<T>(data: T) {
	return apiSuccess(data, 201);
}

export function apiError(message: string, status?: number, errors?: ApiError[]): NextResponse<ApiResponse>;
export function apiError(error: unknown): NextResponse<ApiResponse>;
export function apiError(first: unknown, status = 500, errors?: ApiError[]) {
	if (typeof first !== "string" || arguments.length === 1) {
		return apiErrorFromException(first);
	}

	const body: ApiResponse = {
		success: false,
		message: first,
		...(errors ? { errors } : {}),
	};
	return NextResponse.json(body, { status });
}

export function apiNotFound(message = "Resource not found") {
	return apiError(message, 404);
}

export function apiValidationError(errors: ApiError[] | string) {
	return apiError("Validation failed", 400, typeof errors === "string" ? [{ message: errors }] : errors);
}

export function apiErrorFromException(error: unknown) {
	if (error instanceof AppError) {
		return NextResponse.json(
			{
				success: false,
				message: error.message,
				code: error.code,
				errors: [{ code: error.code, message: error.message }],
			},
			{ status: error.statusCode },
		);
	}

	if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
		return apiError("A record with that value already exists", 409);
	}

	if (
		error instanceof SyntaxError ||
		(typeof error === "object" && error !== null && "name" in error && error.name === "SyntaxError")
	) {
		return apiError("Invalid JSON", 400);
	}

	console.error("Unhandled error:", error);
	return apiError("Internal server error", 500);
}
