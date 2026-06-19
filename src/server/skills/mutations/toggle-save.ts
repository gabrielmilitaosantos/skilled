import { auth } from "@clerk/tanstack-react-start/server";
import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db/client.ts";
import { savedSkills } from "#/db/schema.ts";
import { UnauthorizedError } from "#/lib/errors.ts";
import { getUserByClerkId } from "#/server/users/queries/get-user-by-clerk-id.ts";

export const toggleSave = createServerFn({ method: "POST" })
	.inputValidator(z.object({ skillId: z.uuid() }))
	.handler(async ({ data }) => {
		const { userId: clerkId } = await auth();
		if (!clerkId) throw new Error("Unauthorized");

		const user = await getUserByClerkId(clerkId);
		if (!user) throw new UnauthorizedError("User not found");

		const [inserted] = await db
			.insert(savedSkills)
			.values({
				userId: user.id,
				skillId: data.skillId,
			})
			.onConflictDoNothing()
			.returning({ id: savedSkills.skillId });

		if (inserted) {
			return { saved: true };
		}

		await db
			.delete(savedSkills)
			.where(
				and(
					eq(savedSkills.userId, user.id),
					eq(savedSkills.skillId, data.skillId),
				),
			);
		return { saved: false };
	});
