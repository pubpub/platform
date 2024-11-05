import { Toaster } from "ui/toaster";

import "ui/styles.css";

// import "./globals.css";

import { TooltipProvider } from "ui/tooltip";

export const metadata = {
	title: "PubPub Platform",
	description: "A more flexible PubPub",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body>
				<TooltipProvider>
					{children}
					<Toaster />
				</TooltipProvider>
			</body>
		</html>
	);
}
