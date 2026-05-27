import {
	createFileRoute,
	redirect,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import { ArrowLeft, Zap } from "lucide-react";
import { useState } from "react";
import { createSkill } from "#/server/skills/mutations/create-skill.ts";
import { skillSchema } from "#/server/skills/schemas/skill-schema.ts";

export const Route = createFileRoute("/skills/new")({
	beforeLoad: async ({ context }) => {
		if (!context.userId) {
			throw redirect({ to: "/sign-in/$" });
		}
	},
	component: NewSkillPage,
});

function NewSkillPage() {
	const navigate = useNavigate();
	const router = useRouter();

	const [fields, setFields] = useState({
		title: "",
		description: "",
		tags: "",
		installCommand: "",
		promptConfig: "",
		usageExample: "",
	});

	const [errors, setErrors] = useState<Record<string, string>>({});
	const [submitting, setSubmitting] = useState(false);

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));

		if (errors[e.target.name]) {
			setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
		}
	};

	const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();

		// Parse the tags string in array before validate.
		const parsed = skillSchema.safeParse({
			...fields,
			tags: fields.tags
				.split(",")
				.map((tag) => tag.trim())
				.filter(Boolean),
		});

		if (!parsed.success) {
			const fieldErrors: Record<string, string> = {};
			for (const issue of parsed.error.issues) {
				const key = issue.path[0]?.toString();
				if (key) fieldErrors[key] = issue.message;
			}
			setErrors(fieldErrors);
			return;
		}

		setSubmitting(true);

		try {
			await createSkill({ data: parsed.data });
			// Invalidate the cache loader of homepage to get the new skill.
			await router.invalidate();
			await navigate({ to: "/" });
		} catch (error) {
			console.error("Failed to create skill: ", error);
			setErrors({ form: "Something went wrong. Please try again" });
		} finally {
			setSubmitting(false);
		}
	};

	const handleCancel = async () => {
		setFields({
			title: "",
			description: "",
			tags: "",
			installCommand: "",
			promptConfig: "",
			usageExample: "",
		});
		await navigate({ to: "/" });
	};

	return (
		<div id="new-skill">
			<button type="button" className="back" onClick={handleCancel}>
				<ArrowLeft size={14} /> <span>Back to explore</span>
			</button>

			<div className="intro">
				<h1>
					Submit a <span className="text-gradient">new skill</span>
				</h1>
				<p>Share your procedural knowledge with the AI agent community.</p>
			</div>

			<form onSubmit={handleSubmit} noValidate>
				{errors.form && (
					<div className="alert error" style={{ marginBottom: "2rem" }}>
						{errors.form}
					</div>
				)}

				<div className="content">
					<div className="block">
						{/*Title*/}
						<div className="form-item">
							<label htmlFor="title" className="form-label">
								Skill Title
							</label>
							<input
								id="title"
								name="title"
								type="text"
								className="input-field input-field-lg"
								value={fields.title}
								onChange={handleChange}
								placeholder="e.g. Advanced Research Agent"
							/>
							<span className="form-description">
								A clear, concise name for your skill.
							</span>

							{errors.title && (
								<span className="form-message">{errors.title}</span>
							)}
						</div>

						{/*Description*/}
						<div className="form-item">
							<label htmlFor="description" className="form-label">
								Description
							</label>
							<textarea
								id="description"
								name="description"
								className="input-field input-field-sm input-field-textarea input-field-description"
								value={fields.description}
								onChange={handleChange}
								placeholder="What does this skill do?"
							/>
							{errors.description && (
								<span className="form-message">{errors.description}</span>
							)}
						</div>

						{/*Tags*/}
						<div className="form-item">
							<label htmlFor="tags" className="form-label">
								Tags
							</label>
							<input
								id="tags"
								name="tags"
								type="text"
								className="input-field input-field-sm"
								value={fields.tags}
								onChange={handleChange}
								placeholder="RESEARCH, ACADEMIC, AGENTS"
							/>
							<span className="form-description">Comma separated tags.</span>
							{errors.tags && (
								<span className="form-message">{errors.tags}</span>
							)}
						</div>

						{/*Install Command*/}
						<div className="form-item">
							<label htmlFor="installCommand" className="form-label">
								Install Command
							</label>
							<input
								id="installCommand"
								name="installCommand"
								type="text"
								className="input-field input-field-sm input-field-mono"
								value={fields.installCommand}
								onChange={handleChange}
								placeholder="npm install my-skill"
							/>
							{errors.installCommand && (
								<span className="form-message">{errors.installCommand}</span>
							)}
						</div>

						{/*Prompt Config*/}
						<div className="form-item">
							<label htmlFor="promptConfig" className="form-label">
								Prompt Config
							</label>
							<textarea
								id="promptConfig"
								name="promptConfig"
								className="input-field input-field-sm input-field-textarea input-field-prompt"
								value={fields.promptConfig}
								onChange={handleChange}
								placeholder="Describe how the agent should behave..."
							/>
							{errors.promptConfig && (
								<span className="form-message">{errors.promptConfig}</span>
							)}
						</div>

						{/*Usage Example*/}
						<div className="form-item">
							<label htmlFor="usageExample" className="form-label">
								Usage Example
							</label>
							<textarea
								id="usageExample"
								name="usageExample"
								className="input-field input-field-sm input-field-textarea input-field-mono input-field-usage"
								value={fields.usageExample}
								onChange={handleChange}
								placeholder="Show how to use this skill..."
							/>
							{errors.usageExample && (
								<span className="form-message">{errors.usageExample}</span>
							)}
						</div>
					</div>
				</div>

				<div className="actions">
					<button type="submit" className="btn-primary" disabled={submitting}>
						<Zap size={16} />
						{submitting ? "Publishing..." : "Publish Skill"}
					</button>

					<button
						type="button"
						className="btn-secondary"
						onClick={handleCancel}
						disabled={submitting}
					>
						Cancel
					</button>
				</div>
			</form>
		</div>
	);
}
