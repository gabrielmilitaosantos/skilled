import { auth } from "@clerk/tanstack-react-start/server";
import { createServerFn } from "@tanstack/react-start";
import { count, eq } from "drizzle-orm";
import { db } from "#/db/client.ts";
import { savedSkills, skills, skillVotes, users } from "#/db/schema.ts";
import { getUserByClerkId } from "#/server/users/queries/get-user-by-clerk-id.ts";

export const getSavedSkills = createServerFn({ method: "GET" }).handler(
	async (): Promise<SkillRecord[]> => {
		const { userId: clerkId } = await auth();

		if (!clerkId) throw new Error("Unauthorized");

		const user = await getUserByClerkId(clerkId);
		if (!user) throw new Error("User not found");

		const rows = await db
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
			.from(savedSkills)
			.innerJoin(skills, eq(savedSkills.skillId, skills.id))
			.innerJoin(users, eq(skills.authorId, users.id))
			.leftJoin(skillVotes, eq(skillVotes.skillId, skills.id))
			.where(eq(savedSkills.userId, user.id))
			.groupBy(skills.id, users.id, savedSkills.createdAt)
			.orderBy(savedSkills.createdAt);

		return rows.map((row) => ({
			...row,
			createdAt: row.createdAt.toISOString(),
			voteCount: row.voteCount ?? 0,
			isVoted: true,
			isSaved: true,
		}));
	},
);
