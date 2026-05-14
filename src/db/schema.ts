import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
	id: uuid("id").defaultRandom().primaryKey(),
	clerkId: text("clerk_id").notNull().unique(),
	email: text("email").notNull().unique(),
	username: text("username").notNull().unique(),
	imageUrl: text("image_url"),
});

export const skills = pgTable(
	"skills",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		// Skills are user-specific content and should not persist after user deletion
		authorId: uuid("author_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }), // FK
		title: text("title").notNull(),
		description: text("description").notNull(),
		tags: text("tags").array().notNull().default([]), // string[] on TypeScript
		installCommand: text("install_command").notNull(),
		promptConfig: text("prompt_config").notNull(),
		usageExample: text("usage_example"), // Optional
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		authorIdIdx: index("skills_author_id_idx").on(table.authorId),
		createdAtIdx: index("skills_created_at_idx").on(table.createdAt),
		tagsIdx: index("skills_tags_idx").using("gin", table.tags),
	}),
);
