import "ui/styles.css";
import "./globals.css";
import InitClient from "./InitClient";
import { Toaster } from "ui";
import Header from "./header";
import { Inter } from "next/font/google";

export const metadata = {
	title: "PubPub v7 Mockup Demo",
	description: "Just a demo to show the models and structure.",
};

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-inter",
	display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body
				className={`${inter.variable} font-inter antialiased bg-white text-gray-900 tracking-tight`}
			>
				<div className="flex flex-col min-h-screen overflow-hidden supports-[overflow:clip]:overflow-clip">
					<Header />
					<InitClient />
					{children}
					<Toaster />
				</div>
			</body>
		</html>
	);
}
