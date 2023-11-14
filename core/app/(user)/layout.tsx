export default async function UserLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen">
			<div className="container mx-auto py-5">
				<img src="/logos/icon.svg" className="w-6" />
			</div>
			<div className="container mx-auto">{children}</div>
		</div>
	);
}
