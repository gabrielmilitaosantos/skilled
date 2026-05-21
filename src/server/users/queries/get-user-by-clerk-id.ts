import { eq } from "drizzle-orm";
import { db } from "#/db/client.ts";
import { users } from "#/db/schema.ts";

export async function getUserByClerkId(clerkId: string) {
	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.clerkId, clerkId))
		.limit(1);

	return user ?? null;
}
