import { Toaster } from "ui/toaster";
import "ui/styles.css";
import InitClient from "./InitClient";
import { PublicEnvScript } from "next-runtime-env";
import "./globals.css";

export const metadata = {
	title: "PubPub v7 Mockup Demo",
	description: "Just a demo to show the models and structure.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<PublicEnvScript />
			</head>
			<body>
				<InitClient />
				{children}
				<Toaster />
			</body>
		</html>
	);
}
