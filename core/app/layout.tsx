import { Toaster } from "ui/toaster";
import "ui/styles.css";
import InitClient from "./InitClient";
import { PublicEnvProvider } from "next-runtime-env";
import "./globals.css";
import { logger } from "logger";

export const metadata = {
	title: "PubPub v7",
	description: "A more flexible PubPub",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	logger.info("RootLayout");
	return (
		<html lang="en">
			<body>
				<PublicEnvProvider>
					<InitClient />
					{children}
					<Toaster />
				</PublicEnvProvider>
			</body>
		</html>
	);
}
