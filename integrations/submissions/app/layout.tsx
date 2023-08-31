import "ui/styles.css";
import "./globals.css";

export const metadata = {
	title: "PubPub Submissions Integration",
	description: "",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body>
				<h1>Submissions</h1>
				{children}
			</body>
		</html>
	);
}
