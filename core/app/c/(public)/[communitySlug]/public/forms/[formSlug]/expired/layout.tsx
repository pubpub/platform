import { notFound } from "next/navigation";

import { Header } from "~/app/c/(public)/[communitySlug]/public/Header";
import { findCommunityBySlug } from "~/lib/server/community";
import { getForm } from "~/lib/server/form";
import { capitalize } from "~/lib/string";

type Props = { children: React.ReactNode; params: { communitySlug: string; formSlug: string } };

export default async function Layout({ children, params }: Props) {
	const community = await findCommunityBySlug(params.communitySlug);
	if (!community) {
		return null;
	}

	const form = await getForm({
		slug: params.formSlug,
		communityId: community.id,
	}).executeTakeFirst();

	if (!form) {
		return notFound();
	}

	return (
		<div>
			<Header>
				<h1 className="text-xl font-bold">
					{capitalize(form.name)} for {community.name}
				</h1>
			</Header>
			<div className="container mx-auto">{children}</div>
		</div>
	);
}
