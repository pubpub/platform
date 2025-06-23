import { NuqsAdapter } from "nuqs/adapters/next/app";

import "ui/styles.css";

import { Suspense } from "react";
import Script from "next/script";

import { KeyboardShortcutProvider } from "ui/hooks";
// import "./globals.css";

import { TooltipProvider } from "ui/tooltip";

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
