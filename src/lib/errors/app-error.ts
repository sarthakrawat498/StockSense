import type { ApiError } from "@/types/api.types";

/**
 * Base application error for expected operational errors.
 * All custom errors extend AppError so that API route handlers can map
 * them to the correct HTTP status code via a single instanceof check.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;
  public readonly errors?: ApiError[];

  constructor(statusCode: number, message: string, code?: string);
  constructor(
    message: string,
    statusCode?: number,
    options?: { code?: string; errors?: ApiError[]; isOperational?: boolean } | string
  );
  constructor(
    first: number | string,
    second?: string | number,
    third?: { code?: string; errors?: ApiError[]; isOperational?: boolean } | string
  ) {
    let statusCode = 500;
    let message = "Application error";
    let code: string | undefined;
    let errors: ApiError[] | undefined;
    let isOperational = true;

    if (typeof first === "number") {
      statusCode = first;
      message = typeof second === "string" ? second : "Application error";
      if (typeof third === "string") {
        code = third;
      }
    } else {
      message = first;
      statusCode = typeof second === "number" ? second : 500;
      if (typeof third === "object" && third !== null) {
        code = third.code;
        errors = third.errors;
        if (third.isOperational !== undefined) {
          isOperational = third.isOperational;
        }
      } else if (typeof third === "string") {
        code = third;
      }
    }

    if (!code && statusCode === 500) {
      code = "INTERNAL_ERROR";
    }

    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.errors = errors;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request", code = "BAD_REQUEST", errors?: ApiError[]) {
    super(message, 400, { code, errors });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", code = "UNAUTHORIZED") {
    super(message, 401, { code });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", code = "FORBIDDEN") {
    super(message, 403, { code });
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string);
  constructor(messageOrResource?: string, id?: string);
  constructor(messageOrResource = "Resource", id?: string) {
    const message = id
      ? `${messageOrResource} '${id}' not found`
      : /not found$/i.test(messageOrResource)
        ? messageOrResource
        : `${messageOrResource} not found`;
    super(404, message, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message, "CONFLICT");
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", errors?: ApiError[]) {
    super(message, 400, { code: "VALIDATION_ERROR", errors });
  }
}

export class InsufficientStockError extends AppError {
  constructor(productName: string, available: number, requested: number) {
    super(
      `Insufficient stock for '${productName}': available ${available}, requested ${requested}`,
      422,
      { code: "INSUFFICIENT_STOCK" }
    );
  }
}

export class InvalidStatusTransitionError extends AppError {
  constructor(currentStatus: string, targetStatus: string) {
    super(
      `Cannot transition from '${currentStatus}' to '${targetStatus}'`,
      422,
      { code: "INVALID_STATUS_TRANSITION" }
    );
  }
}

export class InternalServerError extends AppError {
  constructor(message = "Internal server error", code = "INTERNAL_SERVER_ERROR") {
    super(message, 500, { code, isOperational: false });
  }
}
