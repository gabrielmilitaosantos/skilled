import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { db } from "#/db/client.ts";
import { skills, users } from "#/db/schema.ts";

export const getSkills = createServerFn({ method: "GET" }).handler(async () => {
	try {
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
				authorEmail: users.email,
				authorUsername: users.username,
				authorImageUrl: users.imageUrl,
			})
			.from(skills)
			.innerJoin(users, eq(skills.authorId, users.id))
			.orderBy(desc(skills.createdAt))
			.limit(10)
			.offset(0);

		return rows.map((row) => ({
			...row,
			createdAt: row.createdAt.toISOString(),
		}));
	} catch (error) {
		console.error(error);
		return [];
	}
});
