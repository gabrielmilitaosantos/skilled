import { z } from "zod";

export const skillSchema = z.object({
	title: z
		.string()
		.trim()
		.min(3, "Title must be at least 3 chars")
		.max(100, "Title must be at most 100 characters"),
	description: z
		.string()
		.trim()
		.min(10, "Description must be at least 3 chars")
		.max(500, "Description must be at most 500 characters"),
	tags: z
		.union([z.string(), z.array(z.string())])
		.transform((val) => {
			if (Array.isArray(val)) return val;
			return val
				.split(",")
				.map((t) => t.trim())
				.filter(Boolean);
		})
		.pipe(z.array(z.string()).min(1, "At least one tag is required")),
	installCommand: z
		.string()
		.trim()
		.min(5, "Install Command must be at least 5 chars")
		.max(200, "Install Command must be at most 200 characters"),
	promptConfig: z
		.string()
		.trim()
		.min(10, "Prompt config must be at least 10 chars"),
	usageExample: z
		.string()
		.max(2000, "Usage example must be at most 2000 characters")
		.optional(),
});

export type SkillSchema = z.infer<typeof skillSchema>;
