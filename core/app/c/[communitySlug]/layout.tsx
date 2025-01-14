import type { Metadata } from "next";

import { notFound, redirect } from "next/navigation";

import { CommunityProvider } from "~/app/components/providers/CommunityProvider";
import { getPageLoginData } from "~/lib/authentication/loginData";
import { getCommunityRole } from "~/lib/authentication/roles";
import { findCommunityBySlug } from "~/lib/server/community";
import SideNav from "./SideNav";

type Props = { children: React.ReactNode; params: { communitySlug: string } };

export async function generateMetadata({
	params,
}: {
	params: { communitySlug: string };
}): Promise<Metadata> {
	const community = await findCommunityBySlug(params.communitySlug);

	return {
		title: {
			template: `%s | ${community?.name ?? "PubPub"}`,
			default: community?.name ? `${community?.name} on PubPub` : "PubPub",
		},
	};
}

export default async function MainLayout({ children, params }: Props) {
	const { user } = await getPageLoginData();

	const community = await findCommunityBySlug(params.communitySlug);
	if (!community) {
		return notFound();
	}

	const role = getCommunityRole(user, community);

	if (!role) {
		redirect("/settings");
	}

	const availableCommunities = user?.memberships.map((m) => m.community) ?? [];

	return (
		<CommunityProvider community={community}>
			<div className="flex min-h-screen flex-col md:flex-row">
				<SideNav community={community} availableCommunities={availableCommunities} />
				<div className="relative flex-auto px-4 py-4 md:ml-[250px] md:px-12">
					{children}
				</div>
			</div>
		</CommunityProvider>
	);
}
