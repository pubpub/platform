import { NuqsAdapter } from "nuqs/adapters/next/app";

import "ui/styles.css";

import { Suspense } from "react";

// import "./globals.css";

import { TooltipProvider } from "ui/tooltip";

import { SSERevalidator } from "~/lib/notify/SSERevalidator";
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
				<ReactQueryProvider>
					<NuqsAdapter>
						<TooltipProvider>
							{children}
							<Suspense>
								<RootToaster />
								<SSERevalidator />
							</Suspense>
						</TooltipProvider>
					</NuqsAdapter>
				</ReactQueryProvider>
			</body>
		</html>
	);
}
