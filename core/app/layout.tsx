import "ui/styles.css";
import "./globals.css";
import InitClient from "./InitClient";
import { Toaster } from "ui";

export const metadata = {
	title: "PubPub v7 Mockup Demo",
	description: "Just a demo to show the models and structure.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
