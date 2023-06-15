import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
	title: "PubPub v7 Mockup Demo",
	description: "Just a demo to show the models and structure.",
};

export default function RootLayout({
	children,
	home,
	community,
}: {
	children: React.ReactNode;
	home: React.ReactNode;
	community: React.ReactNode;
}) {
	const loggedIn = true;
	return (
		<html lang="en">
			<body>
				<Providers>
					{children}
					{loggedIn ? community : home}
				</Providers>
			</body>
		</html>
	);
}
