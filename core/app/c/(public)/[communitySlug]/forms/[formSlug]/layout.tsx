import { Button } from "ui/button";
import { Bookmark } from "ui/icon";

import { findCommunityBySlug } from "~/lib/server/community";

type Props = { children: React.ReactNode; params: { communitySlug: string; formSlug: string } };

export default async function Layout({ children, params }: Props) {
	const community = await findCommunityBySlug(params.communitySlug);
	if (!community) {
		return null;
	}
	return (
		<div className="min-h-screen">
			<div className="border-color-gray-100 container mx-auto flex items-center border-b bg-gray-50 py-5">
				<div className="flex-1">
					<img src="/logos/icon.svg" className="w-8" alt="" />
				</div>
				<h1 className="text-xl font-bold">Evaluation for {community.name}</h1>
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
