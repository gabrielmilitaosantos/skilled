import { createServerFn } from "@tanstack/react-start";
import { sql } from "drizzle-orm";
import { db } from "#/db/client.ts";

export const getPopularTags = createServerFn({ method: "GET" }).handler(
	async () => {
		// unnest expands the tags array from each skill in individuals rows
		// allowing group and count the frequency of each tag.
		const rows = await db.execute(sql`
        SELECT unnest(tags) AS tag, COUNT(*)::int AS count 
        FROM skills
        GROUP BY tag
        ORDER BY count DESC
        LIMIT 20
    `);

		return rows.rows as { tag: string; count: number }[];
	},
);
