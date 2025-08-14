import { NuqsAdapter } from "nuqs/adapters/next/app";

import "ui/styles.css";

import { Suspense } from "react";

import { KeyboardShortcutProvider } from "ui/hooks";
import { TooltipProvider } from "ui/tooltip";

import { getLoginData } from "~/lib/authentication/loginData";
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
