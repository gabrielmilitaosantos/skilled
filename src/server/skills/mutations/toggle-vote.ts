import { auth } from "@clerk/tanstack-react-start/server";
import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db/client.ts";
import { skillVotes } from "#/db/schema.ts";
import { UnauthorizedError } from "#/lib/errors.ts";
import { getUserByClerkId } from "#/server/users/queries/get-user-by-clerk-id.ts";

export const toggleVote = createServerFn({ method: "POST" })
	.inputValidator(z.object({ skillId: z.uuid() }))
	.handler(async ({ data }) => {
		const { userId: clerkId } = await auth();
		if (!clerkId) throw new Error("Unauthorized");

		const user = await getUserByClerkId(clerkId);
		if (!user) throw new UnauthorizedError("User not found.");

		// Try to insert.
		// onConflictDoNothing ignores the error if it already exists.
		// Returns empty array
		const [inserted] = await db
			.insert(skillVotes)
			.values({
				userId: user.id,
				skillId: data.skillId,
			})
			.onConflictDoNothing()
			.returning({ id: skillVotes.skillId });

		if (inserted) {
			return { voted: true };
		}

		// Already voted - remove
		await db
			.delete(skillVotes)
			.where(
				and(
					eq(skillVotes.userId, user.id),
					eq(skillVotes.skillId, data.skillId),
				),
			);
		return { voted: false };
	});
