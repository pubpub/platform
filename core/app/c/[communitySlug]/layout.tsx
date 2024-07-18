import { notFound, redirect } from "next/navigation";

import type { UsersId } from "db/public";

import { CommunityProvider } from "~/app/components/providers/CommunityProvider";
import { getLoginData } from "~/lib/auth/loginData";
import { getCommunityRole } from "~/lib/auth/roles";
import { UnauthorizedError } from "~/lib/server";
import { findCommunityBySlug, getAvailableCommunities } from "~/lib/server/community";
import SideNav from "./SideNav";

type Props = { children: React.ReactNode; params: { communitySlug: string } };

export default async function MainLayout({ children, params }: Props) {
	const loginData = await getLoginData();

	if (!loginData) {
		redirect("/login");
	}

	const community = await findCommunityBySlug(params.communitySlug);
	if (!community) {
		return null;
	}

	const role = getCommunityRole(loginData, community);

	if (role === "contributor") {
		// TODO: figure something out for this
		notFound();
	}

	const availableCommunities = await getAvailableCommunities(loginData.id as UsersId);
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
