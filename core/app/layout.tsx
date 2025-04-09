import { NuqsAdapter } from "nuqs/adapters/next/app";

import "ui/styles.css";

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
				<ReactQueryProvider>
					<NuqsAdapter>
						<TooltipProvider>
							{children}
							<RootToaster />
						</TooltipProvider>
					</NuqsAdapter>
				</ReactQueryProvider>
			</body>
		</html>
	);
}
