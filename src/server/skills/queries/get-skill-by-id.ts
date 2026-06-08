import { auth } from "@clerk/tanstack-react-start/server";
import { createServerFn } from "@tanstack/react-start";
import { and, count, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db/client.ts";
import { savedSkills, skills, skillVotes, users } from "#/db/schema.ts";
import { getUserByClerkId } from "#/server/users/queries/get-user-by-clerk-id.ts";

export const getSkillById = createServerFn({ method: "GET" })
	.inputValidator(z.uuid())
	.handler(async ({ data: id }): Promise<SkillRecord | null> => {
		const { userId: clerkId } = await auth();

		const user = clerkId ? await getUserByClerkId(clerkId) : null;

		const [row] = await db
			.select({
				id: skills.id,
				authorId: skills.authorId,
				title: skills.title,
				description: skills.description,
				tags: skills.tags,
				installCommand: skills.installCommand,
				promptConfig: skills.promptConfig,
				usageExample: skills.usageExample,
				createdAt: skills.createdAt,
				authorUsername: users.username,
				authorImageUrl: users.imageUrl,
				voteCount: count(skillVotes.skillId),
			})
			.from(skills)
			.innerJoin(users, eq(skills.authorId, users.id))
			.leftJoin(skillVotes, eq(skillVotes.skillId, skills.id))
			.where(eq(skills.id, id))
			.groupBy(skills.id, users.id);

		if (!row) return null;

		// Check isVoted & isSaved only if there's an authenticated user.
		const [isVoted, isSaved] = user
			? await Promise.all([
					db.query.skillVotes
						.findFirst({
							where: and(
								eq(skillVotes.userId, user.id),
								eq(skillVotes.skillId, id),
							),
						})
						.then(Boolean),
					db.query.savedSkills
						.findFirst({
							where: and(
								eq(savedSkills.userId, user.id),
								eq(savedSkills.skillId, id),
							),
						})
						.then(Boolean),
				])
			: [false, false];

		return {
			...row,
			createdAt: row.createdAt.toISOString(),
			voteCount: row.voteCount ?? 0,
			isVoted,
			isSaved,
		};
	});
