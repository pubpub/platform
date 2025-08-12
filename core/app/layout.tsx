import { NuqsAdapter } from "nuqs/adapters/next/app";

import "ui/styles.css";

import { Suspense } from "react";
import Script from "next/script";

import { KeyboardShortcutProvider } from "ui/hooks";
// import "./globals.css";

import { TooltipProvider } from "ui/tooltip";

import { env } from "~/lib/env/env";
import { ReactQueryProvider } from "./components/providers/QueryProvider";
import { RootToaster } from "./RootToaster";

export const metadata = {
	title: "PubPub Platform",
	description: "A more flexible PubPub",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body>
				{env.NODE_ENV === "development" && env.REACT_SCAN_ENABLED && (
					<Script
						crossOrigin="anonymous"
						src="//unpkg.com/react-scan/dist/auto.global.js"
					/>
				)}
				<KeyboardShortcutProvider>
					<ReactQueryProvider>
						<NuqsAdapter>
							<TooltipProvider>
								{children}
								<Suspense>
									<RootToaster />
								</Suspense>
							</TooltipProvider>
						</NuqsAdapter>
					</ReactQueryProvider>
				</KeyboardShortcutProvider>
			</body>
		</html>
	);
}
