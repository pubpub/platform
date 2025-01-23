import { Toaster } from "ui/toaster";

import "ui/styles.css";

// import "./globals.css";

import { TooltipProvider } from "ui/tooltip";

import { ReactQueryProvider } from "./components/providers/QueryProvider";

export const metadata = {
	title: "PubPub Platform",
	description: "A more flexible PubPub",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body>
				<ReactQueryProvider>
					<TooltipProvider>
						{children}
						<Toaster />
					</TooltipProvider>
				</ReactQueryProvider>
			</body>
		</html>
	);
}
