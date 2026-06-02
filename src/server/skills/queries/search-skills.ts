import { createServerFn } from "@tanstack/react-start";
import { asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db/client.ts";
import { skills, users } from "#/db/schema.ts";

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
			conditions.push(sql`${tag} = ANY(${skills.tags})`);
		}

		const orderBy =
			sort === "oldest"
				? asc(skills.createdAt)
				: sort === "alpha"
					? asc(skills.title)
					: desc(skills.createdAt);

		// Main query with joins and filters
		const baseQuery = db
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
			})
			.from(skills)
			.innerJoin(users, eq(skills.authorId, users.id));

		// Apply the conditions, if any.
		const filteredQuery =
			conditions.length > 0
				? baseQuery.where(
						sql`${conditions.reduce((acc, c) => sql`${acc} AND ${c}`)}`,
					)
				: baseQuery;

		const [rows, countResult] = await Promise.all([
			filteredQuery.orderBy(orderBy).limit(limit).offset(offset),
			db
				.select({ count: sql<number>`COUNT(*)::int` })
				.from(skills)
				.innerJoin(users, eq(skills.authorId, users.id))
				.where(
					conditions.length > 0
						? sql`${conditions.reduce((acc, c) => sql`${acc} AND ${c}`)}`
						: sql`1=1`,
				),
		]);

		const total = countResult[0]?.count ?? 0;

		return {
			skills: rows.map((row) => ({
				...row,
				createdAt: row.createdAt.toISOString(),
			})),
			total,
			page,
			totalPages: Math.ceil(total / limit),
		};
	});
