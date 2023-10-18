export default async function UserLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="grow">
			<div className="container mx-auto">{children}</div>
		</div>
	);
}
