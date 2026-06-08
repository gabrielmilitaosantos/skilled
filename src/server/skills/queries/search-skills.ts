import { auth } from "@clerk/tanstack-react-start/server";
import { createServerFn } from "@tanstack/react-start";
import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db/client.ts";
import { skills, skillVotes, users } from "#/db/schema.ts";
import { getUserSkillStates } from "#/server/skills/queries/get-user-skill-states.ts";
import { getUserByClerkId } from "#/server/users/queries/get-user-by-clerk-id.ts";

const searchSkillsSchema = z.object({
	query: z.string().optional(),
	tag: z.string().optional(),
	sort: z.enum(["newest", "oldest", "alpha"]).default("newest"),
	page: z.number().int().positive().default(1),
});

export type SearchSkillsInput = z.infer<typeof searchSkillsSchema>;

export type SearchSkillsResult = {
	skills: SkillRecord[];
	total: number;
	page: number;
	totalPages: number;
};

export const searchSkills = createServerFn({ method: "GET" })
	.inputValidator(searchSkillsSchema)
	.handler(async ({ data }): Promise<SearchSkillsResult> => {
		const { query, tag, sort, page } = data;

		const limit = 10;
		const offset = (page - 1) * limit;

		const { userId: clerkId } = await auth();
		const user = clerkId ? await getUserByClerkId(clerkId) : null;

		// Search conditions by text - filter by title, tags and author username.
		const conditions = [];

		if (query) {
			conditions.push(
				or(
					ilike(skills.title, `%${query}%`),
					ilike(users.username, `%${query}%`),
					sql`EXISTS (
                        SELECT 1 FROM unnest(${skills.tags}) AS t
                        WHERE t ILIKE ${`%${query}%`}
                    )`,
				),
			);
		}

		if (tag) {
			// Filter the skills that contain exactly the selected tag.
			conditions.push(sql`EXISTS (
				SELECT 1
				FROM unnest(${skills.tags}) AS t
				WHERE lower(t) = lower(${tag})
			)`);
		}

		const orderBy =
			sort === "oldest"
				? asc(skills.createdAt)
				: sort === "alpha"
					? asc(skills.title)
					: desc(skills.createdAt);

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		const [rows, countResult] = await Promise.all([
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
					authorEmail: users.email,
					authorUsername: users.username,
					authorImageUrl: users.imageUrl,
					voteCount: count(skillVotes.skillId),
				})
				.from(skills)
				.innerJoin(users, eq(skills.authorId, users.id))
				.leftJoin(skillVotes, eq(skillVotes.skillId, skills.id))
				.where(whereClause)
				.groupBy(skills.id, users.id)
				.orderBy(orderBy)
				.limit(limit)
				.offset(offset),
			db
				.select({
					count: sql<number>`COUNT(*)::int`,
				})
				.from(skills)
				.innerJoin(users, eq(skills.authorId, users.id))
				.where(whereClause),
		]);

		const total = countResult[0]?.count ?? 0;

		if (!user) {
			return {
				skills: rows.map((row) => ({
					...row,
					createdAt: row.createdAt.toISOString(),
					voteCount: row.voteCount ?? 0,
					isVoted: false,
					isSaved: false,
				})),
				total,
				page,
				totalPages: Math.ceil(total / limit),
			};
		}

		const skillIds = rows.map((row) => row.id);
		const { votedSet, savedSet } = await getUserSkillStates(user.id, skillIds);

		return {
			skills: rows.map((row) => ({
				...row,
				createdAt: row.createdAt.toISOString(),
				voteCount: row.voteCount ?? 0,
				isVoted: votedSet.has(row.id),
				isSaved: savedSet.has(row.id),
			})),
			total,
			page,
			totalPages: Math.ceil(total / limit),
		};
	});
