import "ui/styles.css";
import "./globals.css";
import { Button, Toaster } from "ui";
import { cn } from "utils";

export const metadata = {
	title: "PubPub Submissions Integration",
	description: "",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body className="flex flex-col">
				<main className={cn("w-5/6 mx-auto max-w-4xl")}>
					<h1>Submissions</h1>
					{children}
				</main>
				<Toaster />
			</body>
		</html>
	);
}
