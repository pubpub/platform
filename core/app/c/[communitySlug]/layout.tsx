import { redirect } from "next/navigation";

import type { CommunitiesId } from "~/kysely/types/public/Communities";
import type { UsersId } from "~/kysely/types/public/Users";
import { CommunityProvider } from "~/app/components/providers/CommunityProvider";
import { getLoginData } from "~/lib/auth/loginData";
import { getAvailableCommunities, getCommunityData } from "~/lib/server/community";
import SideNav from "./SideNav";

type Props = { children: React.ReactNode; params: { communitySlug: string } };

export default async function MainLayout({ children, params }: Props) {
	const loginData = await getLoginData();
	if (!loginData) {
		redirect("/login");
	}

	const community = await getCommunityData(params.communitySlug as CommunitiesId);
	if (!community) {
		return null;
	}

	// const member = await prisma.member.findFirst({
	// 	where: { userId: loginData.id, communityId: community.id },
	// });
	// if (!member) {
	// 	redirect("/settings");
	// }

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
