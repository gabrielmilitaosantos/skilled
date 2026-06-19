import { auth } from "@clerk/tanstack-react-start/server";
import { createServerFn } from "@tanstack/react-start";
import { count, desc, eq } from "drizzle-orm";
import { db, withDatabaseErrorHandling } from "#/db/client.ts";
import { skills, skillVotes, users } from "#/db/schema.ts";
import { getUserSkillStates } from "#/server/skills/queries/get-user-skill-states.ts";
import { getUserByClerkId } from "#/server/users/queries/get-user-by-clerk-id.ts";

export const getSkills = createServerFn({ method: "GET" }).handler(
	async (): Promise<SkillRecord[]> => {
		const { userId: clerkId } = await auth();
		const user = clerkId ? await getUserByClerkId(clerkId) : null;

		const rows = await withDatabaseErrorHandling(() =>
			db
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
				.groupBy(skills.id, users.id)
				.orderBy(desc(skills.createdAt))
				.limit(10),
		);

		if (!user) {
			return rows.map((row) => ({
				...row,
				createdAt: row.createdAt.toISOString(),
				voteCount: row.voteCount ?? 0,
				isVoted: false,
				isSaved: false,
			}));
		}

		// For authenticated users, search for upvote & save states.
		const skillIds = rows.map((row) => row.id);
		const { votedSet, savedSet } = await getUserSkillStates(user.id, skillIds);

		return rows.map((row) => ({
			...row,
			createdAt: row.createdAt.toISOString(),
			voteCount: row.voteCount ?? 0,
			isVoted: votedSet.has(row.id),
			isSaved: savedSet.has(row.id),
		}));
	},
);
