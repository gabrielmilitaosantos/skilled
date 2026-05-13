import { createFileRoute, Link } from "@tanstack/react-router";
import { Terminal } from "lucide-react";
import SkillCard from "#/components/SkillCard.tsx";
import { dummySkills } from "#/lib/dummy-skills.ts";

export const Route = createFileRoute("/")({ component: App });

function App() {
	return (
		<div id="home">
			<section className="hero">
				<div className="copy">
					<h1>
						The Registry for <br />
						<span className="text-gradient">Agentic Intelligence</span>
					</h1>
					<p>
						A high-performance registry for procedural agent skills. Discover,
						publish, and operate reusable agent capabilities from a route-driven
						workspace.
					</p>
				</div>

				<div className="actions">
					<Link
						to="/skills"
						className="btn-primary"
						onClick={() => window.umami?.track("browse_registry_clicked")}
					>
						<Terminal size={18} />
						<span>Browse Registry</span>
					</Link>
					<Link
						to="/skills/new"
						className="btn-secondary"
						onClick={() => window.umami?.track("publish_skill_checked")}
					>
						Publish Skill
					</Link>
				</div>
			</section>

			<section className="latest">
				<div className="space-y-2">
					<h2>
						Recently created <span className="text-gradient">Skills</span>
					</h2>
					<p>Latest skills loaded in descending creation order.</p>
				</div>

				<div>
					{dummySkills.length > 0 ? (
						<div className="skills-grid">
							{dummySkills.map((skill) => (
								<SkillCard key={skill.id} {...skill} />
							))}
						</div>
					) : (
						<p>No skills have been created yet.</p>
					)}
				</div>
			</section>
		</div>
	);
}
