import { useEffect, useState } from "react";

type Theme = "dark" | "light";

const STORAGE_KEY = "skilled-theme";

function applyTheme(theme: Theme) {
	const root = document.documentElement;
	if (theme === "dark") {
		root.classList.add("dark");
	} else {
		root.classList.remove("dark");
	}
	localStorage.setItem(STORAGE_KEY, theme);
}

export function useTheme() {
	// SSR and client start with "dark" to avoid mismatches.
	const [theme, setTheme] = useState<Theme>("dark");

	useEffect(() => {
		const current = document.documentElement.classList.contains("dark")
			? "dark"
			: "light";
		setTheme(current);
	}, []);

	const toggle = () => {
		const next: Theme = theme === "dark" ? "light" : "dark";
		setTheme(next);
		applyTheme(next);
	};

	return { theme, toggle };
}
