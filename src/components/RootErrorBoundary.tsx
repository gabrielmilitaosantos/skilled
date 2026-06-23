import { Link, useRouter } from "@tanstack/react-router";
import {
	AlertTriangle,
	Database,
	Home,
	Lock,
	RefreshCw,
	SearchX,
} from "lucide-react";
import {
	isDatabaseError,
	isNotFoundError,
	isUnauthorizedError,
} from "#/lib/errors.ts";

interface ErrorConfig {
	icon: React.ReactNode;
	title: string;
	message: string;
	action: React.ReactNode;
}

function getErrorConfig(error: unknown): ErrorConfig {
	if (isNotFoundError(error)) {
		return {
			icon: <SearchX size={40} className="text-text-muted" />,
			title: "Not Found",
			message: error.message,
			action: (
				<Link to="/" className="btn-primary">
					<Home size={16} />
					Back to Home
				</Link>
			),
		};
	}

	if (isUnauthorizedError(error)) {
		return {
			icon: <Lock size={40} className="text-text-muted" />,
			title: "Access Denied",
			message: error.message,
			action: (
				<Link to="/sign-in/$" className="btn-primary">
					Sign In
				</Link>
			),
		};
	}

	if (isDatabaseError(error)) {
		return {
			icon: <Database size={40} className="text-text-muted" />,
			title: "Service Unavailable",
			message: error.message,
			action: <RetryButton />,
		};
	}

	// Generic error
	return {
		icon: <AlertTriangle size={40} className="text-text-muted" />,
		title: "Something went wrong",
		message:
			error instanceof Error
				? error.message
				: "An unexpected error occurred. Please try again.",
		action: <RetryButton />,
	};
}

function RetryButton() {
	const router = useRouter();
	return (
		<button
			type="button"
			className="btn-primary"
			onClick={() => router.invalidate()}
		>
			<RefreshCw size={16} />
			Try Again
		</button>
	);
}

interface RootErrorBoundaryProps {
	error: unknown;
}

export function RootErrorBoundary({ error }: RootErrorBoundaryProps) {
	const config = getErrorConfig(error);

	return (
		<div id="error-page">
			<div className="error-content">
				{config.icon}
				<div className="error-copy">
					<h1>{config.title}</h1>
					<p>{config.message}</p>
				</div>
				<div className="error-actions">{config.action}</div>
			</div>
		</div>
	);
}
