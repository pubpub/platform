import './globals.css'
import { Providers } from "./providers";

export const metadata = {
	title: "PubPub v7 Mockup Demo",
	description: "Just a demo to show the models and structure.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
