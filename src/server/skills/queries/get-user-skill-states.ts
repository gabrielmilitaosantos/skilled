import { and, eq, inArray } from "drizzle-orm";
import { db } from "#/db/client.ts";
import { savedSkills, skillVotes } from "#/db/schema.ts";

export async function getUserSkillStates(userId: string, skillIds: string[]) {
	if (skillIds.length === 0) {
		return { votedSet: new Set<string>(), savedSet: new Set<string>() };
	}

	const [votedRows, savedRows] = await Promise.all([
		db
			.select({ skillId: skillVotes.skillId })
			.from(skillVotes)
			.where(
				and(
					eq(skillVotes.userId, userId),
					inArray(skillVotes.skillId, skillIds),
				),
			),
		db
			.select({ skillId: savedSkills.skillId })
			.from(savedSkills)
			.where(
				and(
					eq(savedSkills.userId, userId),
					inArray(savedSkills.skillId, skillIds),
				),
			),
	]);

	return {
		votedSet: new Set(votedRows.map((row) => row.skillId)),
		savedSet: new Set(savedRows.map((row) => row.skillId)),
	};
}
