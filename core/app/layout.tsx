import { NuqsAdapter } from "nuqs/adapters/next/app"

import "./globals.css"

import Script from "next/script"

import { KeyboardShortcutProvider } from "ui/hooks"
import { Toaster } from "ui/toaster"
import { TooltipProvider } from "ui/tooltip"

import { getLoginData } from "~/lib/authentication/loginData"
import { env } from "~/lib/env/env"
import { ReactQueryProvider } from "./components/providers/QueryProvider"
import { UserProvider } from "./components/providers/UserProvider"
import { ThemeProvider } from "./components/theme/ThemeProvider"

export const metadata = {
	title: {
		template: `%s | PubPub Platform`,
		default: "PubPub Platform",
	},
	description: "A more flexible PubPub",
	icons: [{ url: "/icons/default_favicon.ico" }],
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	const loginData = await getLoginData()
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				{env.NODE_ENV === "development" && (
					<Script
						crossOrigin="anonymous"
						src="//unpkg.com/react-scan/dist/auto.global.js"
					/>
				)}
			</head>
			<body className="bg-background">
				<UserProvider {...loginData}>
					<KeyboardShortcutProvider>
						<ReactQueryProvider>
							<NuqsAdapter>
								<TooltipProvider>
									<ThemeProvider
										attribute="class"
										defaultTheme="system"
										enableSystem
										disableTransitionOnChange
									>
										{children}
										<Toaster />
									</ThemeProvider>
								</TooltipProvider>
							</NuqsAdapter>
						</ReactQueryProvider>
					</KeyboardShortcutProvider>
				</UserProvider>
			</body>
		</html>
	)
}
