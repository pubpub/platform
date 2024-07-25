import { Button } from "ui/button";
import { Bookmark } from "ui/icon";

import Logo from "~/app/components/Logo";
import { findCommunityBySlug } from "~/lib/server/community";

type Props = { children: React.ReactNode; params: { communitySlug: string; formSlug: string } };

export default async function Layout({ children, params }: Props) {
	const community = await findCommunityBySlug(params.communitySlug);
	if (!community) {
		return null;
	}
	return (
		<div className="isolate min-h-screen">
			<div className="border-color-gray-100 sticky top-0 z-10 flex items-center gap-2 border-b bg-gray-50 py-5">
				<div className="ml-4 flex-1">
					<Logo className="text-[#C1C8CD]" width={32} height={32} />
				</div>

				<h1 className="text-xl font-bold">Evaluation for {community.name}</h1>
				<div className="mr-6 flex flex-1 justify-end">
					<Button variant="outline" className="border-foreground">
						<Bookmark size={16} className="mr-2" strokeWidth={1} /> Bookmark
					</Button>
				</div>
			</div>
			<div className="container mx-auto">{children}</div>
		</div>
	);
}
