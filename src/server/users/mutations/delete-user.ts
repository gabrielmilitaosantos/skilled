import { eq } from "drizzle-orm";
import { db } from "#/db/client.ts";
import { users } from "#/db/schema.ts";

export async function deleteUser(clerkId: string) {
	const [deleted] = await db
		.delete(users)
		.where(eq(users.clerkId, clerkId))
		.returning();

	return deleted;
}
