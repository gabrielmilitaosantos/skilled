import { db } from "#/db/client.ts";
import { users } from "#/db/schema.ts";

interface SyncUserInput {
	clerkId: string;
	email: string;
	username: string;
	imageUrl: string | null;
}

// Server-only function: call from webhook handler.
// It's not a createServerFn - It doesn't need to be accessible by the client
export async function syncUser(input: SyncUserInput) {
	const [user] = await db
		.insert(users)
		.values({
			clerkId: input.clerkId,
			email: input.email,
			username: input.username,
			imageUrl: input.imageUrl,
		})
		// If clerkId already exists, update the data instead of fail.
		.onConflictDoUpdate({
			target: users.clerkId,
			set: {
				email: input.email,
				username: input.username,
				imageUrl: input.imageUrl,
			},
		})
		.returning();

	return user;
}
