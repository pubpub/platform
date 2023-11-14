import { Toaster } from "ui";
import "ui/styles.css";
import InitClient from "./InitClient";
import "./globals.css";

export const metadata = {
	title: "PubPub v7 Mockup Demo",
	description: "Just a demo to show the models and structure.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
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
