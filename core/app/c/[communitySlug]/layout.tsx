import { redirect } from "next/navigation";

import type { UsersId } from "~/kysely/types/public/Users";
import { CommunityProvider } from "~/app/components/providers/CommunityProvider";
import { getLoginData } from "~/lib/auth/loginData";
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

	const availableCommunities = await getAvailableCommunities(loginData.id as UsersId);
	return (
		<CommunityProvider community={community}>
			<div className="flex min-h-screen flex-col md:flex-row">
				<SideNav community={community} availableCommunities={availableCommunities} />
				<div className="relative flex-auto md:ml-[250px]">{children}</div>
			</div>
		</CommunityProvider>
	);
}
