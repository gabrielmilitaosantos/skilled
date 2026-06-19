import { clerkMiddleware } from "@clerk/tanstack-react-start/server";
import { createCsrfMiddleware, createStart } from "@tanstack/react-start";
import {
	databaseErrorAdapter,
	notFoundErrorAdapter,
	unauthorizedErrorAdapter,
} from "#/lib/errors.ts";

// Protect only server functions.
// Server routes (webhook) are free to receive external requests
const csrfMiddleware = createCsrfMiddleware({
	filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => {
	return {
		requestMiddleware: [csrfMiddleware, clerkMiddleware()],
		/*
			Register the adapters - without this, instanceof fails on client
			for any custom error thrown in the server.
		 */
		serializationAdapters: [
			notFoundErrorAdapter,
			unauthorizedErrorAdapter,
			databaseErrorAdapter,
		],
	};
});
