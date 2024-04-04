import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";

import { getLoginData } from "~/lib/auth/loginData";
import prisma from "~/prisma/db";
import SideNav from "./SideNav";

export type CommunityData = Prisma.PromiseReturnType<typeof getCommunity>;

const getCommunity = async (slug: string) => {
	return prisma.community.findUnique({
		where: { slug: slug },
	});
};

const getAvailableCommunities = async (
	loginData: Prisma.UserGetPayload<Prisma.UserDefaultArgs>
) => {
	return prisma.community.findMany({
		where: { members: { some: { userId: loginData?.id } } },
	});
};

type Props = { children: React.ReactNode; params: { communitySlug: string } };

export default async function MainLayout({ children, params }: Props) {
	const loginData = await getLoginData();
	if (!loginData) {
		redirect("/login");
	}
	const community = await getCommunity(params.communitySlug);
	if (!community) {
		return null;
	}
	const member = await prisma.member.findFirst({
		where: { userId: loginData.id, communityId: community.id },
	});
	// if (!member) {
	// 	redirect("/settings");
	// }

	const availableCommunities = await getAvailableCommunities(loginData);
	return (
		<div className="flex min-h-screen">
			<SideNav community={community} availableCommunities={availableCommunities} />
<<<<<<< HEAD
			<div className="ml-64 flex-auto px-12 py-4">{children}</div>
=======
			<div className="flex-auto ml-[250px] py-4 px-12 relative">{children}</div>
>>>>>>> main
		</div>
	);
}
