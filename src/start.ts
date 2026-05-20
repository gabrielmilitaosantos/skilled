import { clerkMiddleware } from "@clerk/tanstack-react-start/server";
import { createCsrfMiddleware, createStart } from "@tanstack/react-start";

// Protect only server functions.
// Server routes (webhook) are free to receive external requests
const csrfMiddleware = createCsrfMiddleware({
	filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => {
	return {
		requestMiddleware: [csrfMiddleware, clerkMiddleware()],
	};
});
