import { Toaster } from "ui/toaster";

import "ui/styles.css";
import "./globals.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TooltipProvider } from "ui/tooltip";

import { client } from "~/lib/api";

const queryClient = new QueryClient();

export const metadata = {
	title: "PubPub Platform",
	description: "A more flexible PubPub",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body>
				<QueryClientProvider client={queryClient}>
					<client.ReactQueryProvider>
						<TooltipProvider>
							{children}
							<Toaster />
						</TooltipProvider>
					</client.ReactQueryProvider>
				</QueryClientProvider>
			</body>
		</html>
	);
}
