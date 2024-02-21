import { Toaster } from "ui";
import "ui/styles.css";
import InitClient from "./InitClient";
import "./globals.css";
import { logger } from "logger";

export const metadata = {
	title: "PubPub v7 Mockup Demo",
	description: "Just a demo to show the models and structure.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	logger.info("RootLayout");
	return (
		<html lang="en">
			<body>
				<InitClient />
				{children}
				<Toaster />
			</body>
		</html>
	);
}
