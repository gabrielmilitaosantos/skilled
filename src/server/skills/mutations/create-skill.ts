import { auth } from "@clerk/tanstack-react-start/server";
import { createServerFn } from "@tanstack/react-start";
import { db } from "#/db/client.ts";
import { skills } from "#/db/schema.ts";
import { UnauthorizedError } from "#/lib/errors.ts";
import { skillSchema } from "#/server/skills/schemas/skill-schema.ts";
import { getUserByClerkId } from "#/server/users/queries/get-user-by-clerk-id.ts";

export const createSkill = createServerFn({ method: "POST" })
	.inputValidator(skillSchema)
	.handler(async ({ data }) => {
		const { userId: clerkId } = await auth();

		if (!clerkId) {
			throw new UnauthorizedError();
		}

		const author = await getUserByClerkId(clerkId);

		if (!author) {
			throw new UnauthorizedError("User not found.");
		}

		const [skill] = await db
			.insert(skills)
			.values({
				authorId: author.id,
				title: data.title,
				description: data.description,
				tags: data.tags,
				installCommand: data.installCommand,
				promptConfig: data.promptConfig,
				usageExample: data.usageExample ?? null,
			})
			.returning();

		return skill;
	});
