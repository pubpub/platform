import { LogoWithText } from "../components/Logo"

export default async function UserLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen">
			<LogoWithText />
			<div className="container mx-auto">{children}</div>
		</div>
	)
}
