import { Show, UserButton } from "@clerk/tanstack-react-start";
import { Link } from "@tanstack/react-router";
import { Bookmark, LogIn, Moon, Plus, Search, Sun } from "lucide-react";
import { useTheme } from "#/hooks/useTheme.ts";

function ThemeToggle() {
	const { theme, toggle } = useTheme();
	const isDark = theme === "dark";

	return (
		<button
			type="button"
			onClick={toggle}
			aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
			aria-pressed={isDark}
			className="theme-toggle"
		>
			{/*Track*/}
			<span className="theme-toggle-track" data-dark={isDark}>
				<Sun size={16} className="theme-toggle-icon theme-toggle-icon-sun" />
				<Moon size={16} className="theme-toggle-icon theme-toggle-icon-moon" />
				<span className="theme-toggle-thumb" data-dark={isDark} />
			</span>
		</button>
	);
}

export default function Navbar() {
	return (
		<nav className="navbar">
			<div className="brand">
				<div className="mark">
					<div className="glyph" />
				</div>
				<Link to="/">
					<span>Skilled</span>
				</Link>
			</div>

			<div className="actions">
				<Show when="signed-in">
					<Link to="/skills" className="navbar-link">
						<Search size={14} />
						<span>Explore</span>
					</Link>

					<Link to="/saved" className="navbar-link">
						<Bookmark size={14} />
						<span>Saved</span>
					</Link>

					<Link to="/skills/new" className="btn-primary navbar-submit">
						<Plus size={14} />
						<span>Submit Skill</span>
					</Link>

					<ThemeToggle />
					<UserButton />
				</Show>

				<Show when="signed-out">
					<ThemeToggle />
					<Link
						to="/sign-in/$"
						className="btn-primary"
						onClick={() => window.umami?.track("sign_in_clicked")}
					>
						<LogIn size={16} />
						Sign In
					</Link>
				</Show>
			</div>
		</nav>
	);
}
