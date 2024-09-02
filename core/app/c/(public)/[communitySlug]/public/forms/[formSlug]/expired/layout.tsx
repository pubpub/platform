import { Header } from "~/app/c/(public)/[communitySlug]/public/Header";
import { getPubTypeForForm } from "~/lib/server";
import { findCommunityBySlug } from "~/lib/server/community";
import { capitalize } from "~/lib/string";

type Props = { children: React.ReactNode; params: { communitySlug: string; formSlug: string } };

export default async function Layout({ children, params }: Props) {
	const community = await findCommunityBySlug(params.communitySlug);
	if (!community) {
		return null;
	}

	const pubType = await getPubTypeForForm({ slug: params.formSlug }).executeTakeFirstOrThrow();

	if (!pubType) {
		return null;
	}

	return (
		<div>
			<Header>
				<h1 className="text-xl font-bold">
					{capitalize(pubType.name)} for {community.name}
				</h1>
			</Header>
			<div className="container mx-auto">{children}</div>
		</div>
	);
}
