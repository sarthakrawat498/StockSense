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

  constructor(
    statusCodeOrMessage: number | string,
    messageOrStatusCode?: string | number,
    optionsOrCode?: { code?: string; errors?: ApiError[]; isOperational?: boolean } | string
  ) {
    let statusCode: number;
    let message: string;
    let code: string | undefined;
    let errors: ApiError[] | undefined;
    let isOperational = true;

    if (typeof statusCodeOrMessage === "number") {
      statusCode = statusCodeOrMessage;
      message = typeof messageOrStatusCode === "string" ? messageOrStatusCode : "Application error";
      if (typeof optionsOrCode === "string") {
        code = optionsOrCode;
      }
    } else {
      message = statusCodeOrMessage;
      statusCode = typeof messageOrStatusCode === "number" ? messageOrStatusCode : 500;
      if (typeof optionsOrCode === "object" && optionsOrCode !== null) {
        code = optionsOrCode.code;
        errors = optionsOrCode.errors;
        if (optionsOrCode.isOperational !== undefined) {
          isOperational = optionsOrCode.isOperational;
        }
      } else if (typeof optionsOrCode === "string") {
        code = optionsOrCode;
      }
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
  constructor(resourceOrMessage = "Resource not found", id?: string, code = "NOT_FOUND") {
    const message = id ? `${resourceOrMessage} '${id}' not found` : resourceOrMessage;
    super(message, 404, { code });
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists", code = "CONFLICT") {
    super(message, 409, { code });
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
