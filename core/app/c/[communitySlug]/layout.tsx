import { notFound, redirect } from "next/navigation";

import type { UsersId } from "db/public";

import { CommunityProvider } from "~/app/components/providers/CommunityProvider";
import { getLoginData } from "~/lib/auth/loginData";
import { getCommunityRole } from "~/lib/auth/roles";
import { findCommunityBySlug, getAvailableCommunities } from "~/lib/server/community";
import SideNav from "./SideNav";

type Props = { children: React.ReactNode; params: { communitySlug: string } };

export default async function MainLayout({ children, params }: Props) {
	const { user } = await getLoginData();

	if (!user) {
		redirect("/login");
	}

	const community = await findCommunityBySlug(params.communitySlug);
	if (!community) {
		return null;
	}

	const role = getCommunityRole(user, community);

	if (role === "contributor") {
		// TODO: figure something out for this
		notFound();
	}

	// const availableCommunities = await getAvailableCommunities(user.id as UsersId);
	const availableCommunities = user?.memberships.map((m) => m.community);

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
