export class AppError extends Error {
	public readonly statusCode: number;
	public readonly code?: string;

	constructor(statusCode: number, message: string, code?: string);
	constructor(message: string, statusCode?: number, code?: string);
	constructor(first: number | string, second?: string | number, third?: string) {
		const statusCode = typeof first === "number" ? first : typeof second === "number" ? second : 500;
		const message = typeof first === "number" ? String(second) : first;
		super(message);
		this.name = this.constructor.name;
		this.statusCode = statusCode;
		this.code = third ?? (statusCode === 500 ? "INTERNAL_ERROR" : undefined);
	}
}

export class NotFoundError extends AppError {
	constructor(resource: string, id?: string);
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
	constructor(message: string) {
		super(400, message, "VALIDATION_ERROR");
	}
}

export class InsufficientStockError extends AppError {
	constructor(productName: string, available: number, requested: number) {
		super(422, `Insufficient stock for '${productName}': available ${available}, requested ${requested}`, "INSUFFICIENT_STOCK");
	}
}

export class InvalidStatusTransitionError extends AppError {
	constructor(currentStatus: string, targetStatus: string) {
		super(422, `Cannot transition from '${currentStatus}' to '${targetStatus}'`, "INVALID_STATUS_TRANSITION");
	}
}
