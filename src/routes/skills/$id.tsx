import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	ArrowBigUp,
	ArrowLeft,
	Bookmark,
	BookmarkCheck,
	Check,
	Copy,
} from "lucide-react";
import { useState } from "react";
import { toggleSave } from "#/server/skills/mutations/toggle-save.ts";
import { toggleVote } from "#/server/skills/mutations/toggle-vote.ts";
import { getSkillById } from "#/server/skills/queries/get-skill-by-id.ts";

export const Route = createFileRoute("/skills/$id")({
	loader: async ({ params }) => {
		const skill = await getSkillById({ data: params.id });
		if (!skill) throw new Error("Skill not found");
		return skill;
	},
	component: SkillDetailPage,
});

function SkillDetailPage() {
	const skill = Route.useLoaderData();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const [voted, setVoted] = useState(skill.isVoted);
	const [saved, setSaved] = useState(skill.isSaved);
	const [votes, setVotes] = useState(skill.voteCount);
	const [votePending, setVotePending] = useState(false);
	const [savePending, setSavePending] = useState(false);
	const [copiedInstall, setCopiedInstall] = useState(false);
	const [copiedPrompt, setCopiedPrompt] = useState(false);
	const [copiedUsage, setCopiedUsage] = useState(false);

	const copyText = async (text: string, setter: (v: boolean) => void) => {
		if (!navigator.clipboard?.writeText) return;
		try {
			await navigator.clipboard.writeText(text);
			setter(true);
			const timeout = setTimeout(() => setter(false), 2000);
			return () => clearTimeout(timeout);
		} catch {}
	};

	const handleVote = async () => {
		if (votePending) return;
		setVotePending(true);

		const prevVoted = voted;
		const prevVotes = votes;
		setVoted(!voted);
		setVotes(voted ? votes - 1 : votes + 1);

		try {
			const result = await toggleVote({ data: { skillId: skill.id } });
			setVoted(result.voted);
			setVotes(result.voted ? prevVotes + 1 : prevVotes - 1);
			await queryClient.invalidateQueries({ queryKey: ["skills"] });
		} catch (error: unknown) {
			setVoted(prevVoted);
			setVotes(prevVotes);
			if (error instanceof Error && error.message.includes("Unauthorized")) {
				await navigate({ to: "/sign-in/$" });
			}
		} finally {
			setVotePending(false);
		}
	};

	const handleSave = async () => {
		if (savePending) return;
		setSavePending(true);

		const prevSaved = saved;
		setSaved(!saved);

		try {
			const result = await toggleSave({ data: { skillId: skill.id } });
			setSaved(result.saved);
			await queryClient.invalidateQueries({ queryKey: ["skills"] });
			await queryClient.invalidateQueries({ queryKey: ["saved-skills"] });
		} catch (error: unknown) {
			setSaved(prevSaved);
			if (error instanceof Error && error.message.includes("Unauthorized")) {
				await navigate({ to: "/sign-in/$" });
			}
		} finally {
			setSavePending(false);
		}
	};

	return (
		<div id="skill-detail">
			<Link to="/skills" className="back">
				<ArrowLeft size={14} />
				<span>Back to explore</span>
			</Link>

			<div className="skill-detail-layout">
				{/* Main */}
				<div className="skill-detail-main">
					<div className="skill-detail-header">
						<h1>{skill.title}</h1>
						<p>{skill.description}</p>
						<div className="skill-detail-tags">
							{skill.tags.map((tag) => (
								<span key={tag} className="tag-chip">
									{tag}
								</span>
							))}
						</div>
					</div>

					{/* Installation */}
					<div className="skill-detail-section">
						<div className="skill-detail-section-header">
							<span className="skill-detail-section-icon">{">_"}</span>
							<h2>Installation</h2>
							<button
								type="button"
								className="section-copy"
								onClick={() => copyText(skill.installCommand, setCopiedInstall)}
								aria-label="Copy install command"
							>
								{copiedInstall ? <Check size={14} /> : <Copy size={14} />}
								<span>{copiedInstall ? "Copied" : "Copy"}</span>
							</button>
						</div>
						<div className="skill-detail-code">
							<code>{skill.installCommand}</code>
						</div>
					</div>

					{/*  Configuration  */}
					<div className="skill-detail-section">
						<div className="skill-detail-section-header">
							<span className="skill-detail-section-icon">{"</>"}</span>
							<h2>Configuration</h2>
							<button
								type="button"
								className="section-copy"
								onClick={() => copyText(skill.promptConfig, setCopiedPrompt)}
								aria-label="Copy prompt config"
							>
								{copiedPrompt ? <Check size={14} /> : <Copy size={14} />}
								<span>{copiedPrompt ? "Copied" : "Copy"}</span>
							</button>
						</div>
						<div className="skill-detail-code">
							<code>{skill.promptConfig}</code>
						</div>
					</div>

					{/*  Usage Example  */}
					{skill.usageExample && (
						<div className="skill-detail-section">
							<div className="skill-detail-section-header">
								<span className="skill-detail-section-icon">📄</span>
								<h2>Usage Example</h2>
								<button
									type="button"
									className="section-copy"
									// biome-ignore lint: false positive (suppressions/incorrect)
									onClick={() => copyText(skill.usageExample!, setCopiedUsage)}
									aria-label="Copy usage example"
								>
									{copiedUsage ? <Check size={14} /> : <Copy size={14} />}
									<span>{copiedUsage ? "Copied" : "Copy"}</span>
								</button>
							</div>
							<div className="skill-detail-code">
								<code>{skill.usageExample}</code>
							</div>
						</div>
					)}
				</div>

				{/*  Author's sidebar  */}
				<aside className="skill-detail-sidebar">
					<div className="sidebar-author">
						<img
							src={skill.authorImageUrl || "/logo512.png"}
							alt={`${skill.authorUsername} avatar`}
							className="sidebar-avatar"
						/>
						<div>
							<p className="sidebar-author-name">{skill.authorUsername}</p>
							<p className="sidebar-author-role">R AUTHOR</p>
						</div>
					</div>

					<div className="sidebar-meta">
						<div className="sidebar-meta-row">
							<span>Published</span>
							<span>
								{new Date(skill.createdAt).toLocaleDateString("en-US", {
									month: "short",
									day: "numeric",
									year: "numeric",
								})}
							</span>
						</div>
					</div>

					<button
						type="button"
						className="btn-primary sidebar-copy-btn"
						onClick={() => copyText(skill.installCommand, setCopiedInstall)}
					>
						{copiedInstall ? <Check size={14} /> : <Copy size={14} />}
						{copiedInstall ? "Copied" : "Copy Install Command"}
					</button>

					<div className="sidebar-actions">
						<button
							type="button"
							className={`sidebar-vote ${voted ? "sidebar-vote-active" : ""}`}
							onClick={handleVote}
							disabled={votePending}
							aria-pressed={voted}
							aria-label={voted ? "Remove upvote" : "Upvote"}
						>
							<ArrowBigUp size={16} fill={voted ? "currentColor" : "none"} />
							<span>{votes}</span>
						</button>

						<button
							type="button"
							className={`sidebar-save ${saved ? "sidebar-save-active" : ""}`}
							onClick={handleSave}
							disabled={savePending}
							aria-pressed={saved}
							aria-label={saved ? "Remove saved" : "Save skill"}
						>
							{saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
							<span>{saved ? "Saved" : "Save"}</span>
						</button>
					</div>
				</aside>
			</div>
		</div>
	);
}
