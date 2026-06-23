// Base error
import { createSerializationAdapter } from "@tanstack/react-router";

export class AppError extends Error {
	constructor(
		message: string,
		public readonly code: string,
		public readonly statusCode: number = 500,
	) {
		super(message);
		this.name = "AppError";
	}
}

export class NotFoundError extends AppError {
	constructor(message = "The requested resource was not found.") {
		super(message, "NOT_FOUND", 404);
		this.name = "NotFoundError";
	}
}

export class UnauthorizedError extends AppError {
	constructor(message = "You must be signed in to access this page.") {
		super(message, "UNAUTHORIZED", 401);
		this.name = "UnauthorizedError";
	}
}

export class DatabaseError extends AppError {
	constructor(
		message = "Failed to connect to the database. Please try again.",
	) {
		super(message, "DATABASE_ERROR", 503);
		this.name = "DatabaseError";
	}
}

// Helpers for checking the instance (fallback serialization)
export function isNotFoundError(error: unknown): error is NotFoundError {
	if (error instanceof NotFoundError) return true;
	if (!(error instanceof Error)) return false;
	return error.name === "NotFoundError";
}

export function isUnauthorizedError(
	error: unknown,
): error is UnauthorizedError {
	if (error instanceof UnauthorizedError) return true;
	if (!(error instanceof Error)) return false;
	return error.name === "UnauthorizedError";
}

export function isDatabaseError(error: unknown): error is DatabaseError {
	if (error instanceof DatabaseError) return true;
	if (!(error instanceof Error)) return false;
	return error.name === "DatabaseError";
}

// ======================================================================
// SERIALIZATION ADAPTERS
// Without this, custom error classes loses your identity [*** TANSTACK START BUG ***]
// (instanceof fails) to cross the server boundary → client
// Each adapter needs a unique 'key'.
// ======================================================================

export const notFoundErrorAdapter = createSerializationAdapter({
	key: "NotFoundError",
	test: (value): value is NotFoundError => value instanceof NotFoundError,
	toSerializable: (error) => ({ message: error.message }),
	fromSerializable: (data) => new NotFoundError(data.message),
});

export const unauthorizedErrorAdapter = createSerializationAdapter({
	key: "UnauthorizedError",
	test: (value): value is UnauthorizedError =>
		value instanceof UnauthorizedError,
	toSerializable: (error) => ({ message: error.message }),
	fromSerializable: (data) => new UnauthorizedError(data.message),
});

export const databaseErrorAdapter = createSerializationAdapter({
	key: "DatabaseError",
	test: (value): value is DatabaseError => value instanceof DatabaseError,
	toSerializable: (error) => ({ message: error.message }),
	fromSerializable: (data) => new DatabaseError(data.message),
});
