import { Toaster } from "ui/toaster";

import "ui/styles.css";

import { PublicEnvScript } from "next-runtime-env";

import InitClient from "./InitClient";

import "./globals.css";

export const metadata = {
	title: "PubPub v7",
	description: "A more flexible PubPub",
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
