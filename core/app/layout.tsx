import { NuqsAdapter } from "nuqs/adapters/next/app";

import "ui/styles.css";

import { Suspense } from "react";
import Script from "next/script";

import { KeyboardShortcutProvider } from "ui/hooks";
import { TooltipProvider } from "ui/tooltip";

import { getLoginData } from "~/lib/authentication/loginData";
import { env } from "~/lib/env/env";
import { ReactQueryProvider } from "./components/providers/QueryProvider";
import { UserProvider } from "./components/providers/UserProvider";
import { RootToaster } from "./RootToaster";

export const metadata = {
	title: "PubPub Platform",
	description: "A more flexible PubPub",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	const loginData = await getLoginData();
	return (
		<html lang="en">
			<head>
				{env.NODE_ENV === "development" && (
					<Script
						crossOrigin="anonymous"
						src="//unpkg.com/react-scan/dist/auto.global.js"
					/>
				)}
			</head>
			<body>
				<UserProvider {...loginData}>
					<KeyboardShortcutProvider>
						<ReactQueryProvider>
							<NuqsAdapter>
								<TooltipProvider>
									{children}
									<Suspense>
										<RootToaster />
									</Suspense>
								</TooltipProvider>
							</NuqsAdapter>
						</ReactQueryProvider>
					</KeyboardShortcutProvider>
				</UserProvider>
			</body>
		</html>
	);
}
