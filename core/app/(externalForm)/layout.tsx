import { Button } from "ui/button";
import { Bookmark } from "ui/icon";

export default async function Layout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen">
			<div className="border-color-gray-100 container mx-auto flex items-center border-b bg-gray-50 py-5">
				<div className="flex-1">
					<img src="/logos/icon.svg" className="w-8" alt="" />
				</div>
				<h1 className="text-xl font-bold">Evaluation for The Unjournal</h1>
				<div className="flex flex-1 justify-end">
					<Button variant="outline" className="border-foreground">
						<Bookmark size={16} className="mr-2" strokeWidth={1} /> Bookmark
					</Button>
				</div>
			</div>
			<div className="container mx-auto">{children}</div>
		</div>
	);
}
