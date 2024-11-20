import type { Metadata } from "next";

import { CommunityProvider } from "~/app/components/providers/CommunityProvider";
import { getLoginData } from "~/lib/authentication/loginData";
import { getCommunityRole } from "~/lib/authentication/roles";
import { findCommunityBySlug } from "~/lib/server/community";

type Props = { children: React.ReactNode; params: { communitySlug: string } };

export async function generateMetadata({
	params,
}: {
	params: { communitySlug: string };
}): Promise<Metadata> {
	const community = await findCommunityBySlug(params.communitySlug);

	if (!community) {
		return { title: "Community Not Found" };
	}

	return {
		title: {
			template: `%s | ${community.name}`,
			default: `${community.name} on PubPub`,
		},
	};
}

export default async function MainLayout({ children, params }: Props) {
	const { user } = await getLoginData();

	const community = await findCommunityBySlug(params.communitySlug);

	if (!community) {
		return null;
	}

	const role = getCommunityRole(user, { slug: params.communitySlug });

	// the user is logged in, but not a member of the community
	// we should bar them from accessing the page
	if (user && !role) {
		return null;
	}

	return <CommunityProvider community={community}>{children}</CommunityProvider>;
}
