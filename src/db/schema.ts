import {
	index,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

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
	(table) => [
		index("skills_author_id_idx").on(table.authorId),
		index("skills_created_at_idx").on(table.createdAt),
		index("skills_tags_idx").using("gin", table.tags),
	],
);

// Composite key (userId + skillId). User can vote one time for each skill.
export const skillVotes = pgTable(
	"skill_votes",
	{
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		skillId: uuid("skill_id")
			.notNull()
			.references(() => skills.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		primaryKey({ columns: [table.userId, table.skillId] }),
		index("skill_votes_skill_id_idx").on(table.skillId),
	],
);

// Same logic of composite key.
export const savedSkills = pgTable(
	"saved_skills",
	{
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		skillId: uuid("skill_id")
			.notNull()
			.references(() => skills.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		primaryKey({ columns: [table.userId, table.skillId] }),
		index("saved_skills_skill_id_idx").on(table.skillId),
	],
);
