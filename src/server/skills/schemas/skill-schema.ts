import { z } from "zod";

export const skillSchema = z.object({
	title: z
		.string()
		.trim()
		.min(3, "Title must contain at least 3 chars")
		.max(30),
	description: z
		.string()
		.trim()
		.min(3, "Description must contain at least 3 chars")
		.max(255),
	tags: z
		.array(
			z.string().trim().min(2, "Tags must contain at least 2 chars").max(20),
		)
		.min(1, "At least one tag is required")
		.max(20, "At most 20 tags are allowed"),
	installCommand: z
		.string()
		.trim()
		.min(3, "Install Command must contain at least 3 chars"),
	promptConfig: z
		.string()
		.trim()
		.min(3, "Prompt config must contain at least 3 chars"),
	usageExample: z.preprocess(
		(val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
		z.string().optional(),
	),
});

export type SkillSchema = z.infer<typeof skillSchema>;
