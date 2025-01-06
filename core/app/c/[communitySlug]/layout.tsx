import type { Metadata } from "next";

import { notFound, redirect } from "next/navigation";

import { CommunityProvider } from "~/app/components/providers/CommunityProvider";
import { getPageLoginData } from "~/lib/authentication/loginData";
import { getCommunityRole } from "~/lib/authentication/roles";
import { findCommunityBySlug } from "~/lib/server/community";
import SideNav from "./SideNav";

type Props = { children: React.ReactNode; params: Promise<{ communitySlug: string }> };

export async function generateMetadata(props: {
	params: Promise<{ communitySlug: string }>;
}): Promise<Metadata> {
	const params = await props.params;
	const community = await findCommunityBySlug(params.communitySlug);

	return {
		title: {
			template: `%s | ${community?.name ?? "PubPub"}`,
			default: community?.name ? `${community?.name} on PubPub` : "PubPub",
		},
	};
}

export default async function MainLayout(props: Props) {
	const params = await props.params;

	const { children } = props;

	const { user } = await getPageLoginData();

	const community = await findCommunityBySlug(params.communitySlug);
	if (!community) {
		return notFound();
	}

	const role = getCommunityRole(user, community);

	if (role === "contributor" || !role) {
		// TODO: allow contributors to view /c/* pages after we implement membership and
		// role-based authorization checks
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
