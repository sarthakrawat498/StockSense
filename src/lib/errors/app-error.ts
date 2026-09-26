/**
 * Application error hierarchy.
 *
 * All custom errors extend AppError so that API route handlers can map
 * them to the correct HTTP status code via a single instanceof check.
 */

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      404,
      id ? `${resource} '${id}' not found` : `${resource} not found`,
      "NOT_FOUND",
    );
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message, "CONFLICT");
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message, "VALIDATION_ERROR");
  }
}

export class InsufficientStockError extends AppError {
  constructor(productName: string, available: number, requested: number) {
    super(
      422,
      `Insufficient stock for '${productName}': available ${available}, requested ${requested}`,
      "INSUFFICIENT_STOCK",
    );
  }
}

export class InvalidStatusTransitionError extends AppError {
  constructor(currentStatus: string, targetStatus: string) {
    super(
      422,
      `Cannot transition from '${currentStatus}' to '${targetStatus}'`,
      "INVALID_STATUS_TRANSITION",
    );
  }
}
