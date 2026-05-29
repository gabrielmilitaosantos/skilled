import { ClerkProvider } from "@clerk/tanstack-react-start";
import { auth } from "@clerk/tanstack-react-start/server";
import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { createServerFn } from "@tanstack/react-start";
import Crosshair from "#/components/Crosshair.tsx";
import Navbar from "#/components/Navbar.tsx";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
	userId: string | null;
}

// Runs in the server before any route be loaded
const fetchClerkAuth = createServerFn({ method: "GET" }).handler(async () => {
	const { userId } = await auth();
	return { userId };
});

export const Route = createRootRouteWithContext<MyRouterContext>()({
	// userId available for all children routes via context
	beforeLoad: async () => {
		const { userId } = await fetchClerkAuth();
		return { userId };
	},
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Skilled - The Agentic Intelligence Registry",
			},
			{
				name: "description",
				content: "Discover, publish, and operate reusable agent capabilities.",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	shellComponent: RootDocument,
});

const themeScript = `
(() => {
	try {
		const storageKey = "skilled-theme";
		const stored = localStorage.getItem(storageKey);
		
		const theme =
			stored ||
			(window.matchMedia("(prefers-color-scheme: dark)").matches
				? "dark"
				: "light");
				
		if (theme === "dark") {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}
	} catch (_) {}
})();
`;

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: theme script is a static string with no user input */}
				<script dangerouslySetInnerHTML={{ __html: themeScript }} />
				<HeadContent />
				<script
					defer
					src="https://cloud.umami.is/script.js"
					data-website-id="5caf114c-74cb-4115-b021-49ec93b184b2"
				></script>
			</head>
			<body className="font-sans antialiased wrap-anywhere">
				<ClerkProvider>
					<div id="root-layout">
						<header>
							<div className="frame">
								<Navbar />
								<Crosshair />
								<Crosshair />
							</div>
						</header>

						<main>
							<div className="frame">{children}</div>
						</main>
					</div>

					<TanStackDevtools
						config={{
							position: "bottom-right",
						}}
						plugins={[
							{
								name: "Tanstack Router",
								render: <TanStackRouterDevtoolsPanel />,
							},
							TanStackQueryDevtools,
						]}
					/>
				</ClerkProvider>
				<Scripts />
			</body>
		</html>
	);
}
