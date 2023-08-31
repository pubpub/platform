import "ui/styles.css";
import "./globals.css";

export const metadata = {
	title: "PubPub Evaluations Integration",
	description: "",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body>
				<h1>Evalutions</h1>
				{children}
			</body>
		</html>
	);
}
