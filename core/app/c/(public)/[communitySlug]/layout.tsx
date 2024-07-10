import { CommunityProvider } from "~/app/components/providers/CommunityProvider";
import { findCommunityBySlug } from "~/lib/server/community";

type Props = { children: React.ReactNode; params: { communitySlug: string } };

export default async function MainLayout({ children, params }: Props) {
	const community = await findCommunityBySlug(params.communitySlug);
	if (!community) {
		return null;
	}

	return <CommunityProvider community={community}>{children}</CommunityProvider>;
}
