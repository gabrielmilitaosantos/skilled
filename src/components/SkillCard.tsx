import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
	ArrowBigUp,
	ArrowUpRight,
	Bookmark,
	BookmarkCheck,
	Check,
	Copy,
	MessageSquare,
} from "lucide-react";
import { useState } from "react";
import { toggleSave } from "#/server/skills/mutations/toggle-save.ts";
import { toggleVote } from "#/server/skills/mutations/toggle-vote.ts";

const SkillCard = ({
	id,
	createdAt,
	description,
	installCommand,
	tags,
	title,
	authorUsername,
	authorImageUrl,
	voteCount,
	isVoted,
	isSaved,
}: SkillRecord) => {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const [copied, setCopied] = useState(false);
	const [voted, setVoted] = useState(isVoted);
	const [saved, setSaved] = useState(isSaved);
	const [votes, setVotes] = useState(voteCount);
	const [votePending, setVotePending] = useState(false);
	const [savePending, setSavePending] = useState(false);

	const category = tags[0] ?? "General";

	const handleCopy = async () => {
		if (!navigator.clipboard?.writeText) return;
		try {
			await navigator.clipboard.writeText(installCommand);
			window.umami?.track("install_command_copied", { skill: title });
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			setCopied(false);
		}
	};

	const handleVote = async (e: React.MouseEvent) => {
		// Prevents the click from propagating to the overlay that navigates to the skill.
		e.preventDefault();
		e.stopPropagation();

		if (votePending) return;

		/*
			If not authenticated, isVoted will always be false.
			toggleVote will throw 'Unauthorized' - redirect before.
		 */

		setVotePending(true);

		// Update the UI before server's answer.
		const prevVoted = voted;
		const prevVotes = votes;
		setVoted(!voted);
		setVotes(voted ? votes - 1 : votes + 1);

		try {
			const result = await toggleVote({ data: { skillId: id } });
			setVoted(result.voted);
			setVotes(result.voted ? prevVotes + 1 : prevVotes - 1);

			// Invalidate the cache for sync w/ other card instances
			await queryClient.invalidateQueries({ queryKey: ["skills"] });
		} catch (error: unknown) {
			// Reverts the optimistic update in case of error.
			setVoted(prevVoted);
			setVotes(prevVotes);

			if (error instanceof Error && error.message.includes("Unauthorized")) {
				await navigate({ to: "/sign-in/$" });
			}
		} finally {
			setVotePending(false);
		}
	};

	const handleSave = async (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (savePending) return;

		setSavePending(true);

		const prevSaved = saved;
		setSaved(!saved);

		try {
			const result = await toggleSave({ data: { skillId: id } });
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
		<article className="skill-card">
			<Link
				to="/skills/$id"
				params={{ id }}
				tabIndex={-1}
				aria-label={`Open ${title}`}
				className="overlay"
			/>
			<div className="chrome">
				<div className="chrome-bar">
					<div className="lights">
						<div className="light red" />
						<div className="light amber" />
						<div className="light green" />
					</div>
					<div className="host">registry.sh</div>
				</div>
			</div>

			<div className="body">
				<div className="meta">
					<div className="author">
						<img
							src={authorImageUrl || "/logo512.png"}
							alt={`${authorUsername} avatar`}
							className="avatar"
						/>
						<div className="author-copy">
							<p>{authorUsername}</p>
							<p>
								{createdAt
									? new Date(createdAt).toLocaleDateString()
									: "Unknown date"}
							</p>
						</div>
					</div>

					<p className="category">{category}</p>
				</div>

				<div className="summary">
					<Link to="/skills/$id" params={{ id }} className="title-link">
						<h3>{title}</h3>
					</Link>

					<p>{description}</p>
				</div>

				<div className="command">
					<div className="command-copy">
						<span>{">_"}</span>
						<p>{installCommand}</p>
					</div>
					<button
						type="button"
						className="copy"
						onClick={handleCopy}
						aria-label={copied ? "Copied!" : "Copy install command"}
					>
						{copied ? (
							<Check size={16} className="copied" />
						) : (
							<Copy size={16} />
						)}
					</button>
				</div>

				<div className="footer">
					<div className="stats">
						<button
							type="button"
							className={`upvote ${voted ? "upvote-active" : ""}`}
							onClick={handleVote}
							disabled={votePending}
							aria-label={voted ? "Remove upvote" : "Upvote"}
							aria-pressed={voted}
						>
							<ArrowBigUp size={16} fill={voted ? "currentColor" : "none"} />
							<span>{votes}</span>
						</button>

						<div className="comments">
							<MessageSquare size={14} />
							<span>0</span>
						</div>
					</div>

					<div className="actions">
						<Link
							to="/skills/$id"
							params={{ id }}
							className="open"
							title={`Open ${title}`}
							onClick={() =>
								window.umami?.track("skill_opened", { skill: title })
							}
						>
							<span>Open</span>
							<ArrowUpRight size={14} />
						</Link>

						<button
							type="button"
							className={`save ${saved ? "save-active" : ""}`}
							onClick={handleSave}
							disabled={savePending}
							aria-label={saved ? "Remove from saved" : "Save skill"}
							aria-pressed={saved}
						>
							{saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
						</button>
					</div>
				</div>
			</div>
		</article>
	);
};

export default SkillCard;
