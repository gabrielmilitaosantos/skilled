import { createFileRoute, redirect } from "@tanstack/react-router";
import SkillCard from "#/components/SkillCard.tsx";
import { getSavedSkills } from "#/server/skills/queries/get-saved-skills.ts";

export const Route = createFileRoute("/saved")({
	beforeLoad: ({ context }) => {
		if (!context.userId) {
			throw redirect({ to: "/sign-in/$" });
		}
	},
	loader: () => getSavedSkills(),
	staleTime: 30_000,
	component: SavedPage,
});

function SavedPage() {
	const skills = Route.useLoaderData();

	return (
		<div id="saved-page">
			<div className="intro">
				<h1>
					Saved <span className="text-gradient">Skills</span>
				</h1>
				<p>Skills you bookmarked for later.</p>
			</div>

			{skills.length > 0 ? (
				<div className="skills-grid">
					{skills.map((skill) => (
						<SkillCard key={skill.id} {...skill} />
					))}
				</div>
			) : (
				<div className="saved-empty">
					<p>You haven't saved any skills yet.</p>
				</div>
			)}
		</div>
	);
}
