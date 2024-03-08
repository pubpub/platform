import { Prisma } from "@prisma/client";
import prisma from "~/prisma/db";
import { getLoginData } from "~/lib/auth/loginData";
import SideNav from "./SideNav";
import { redirect } from "next/navigation";

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
			<div className="flex-auto ml-[250px]">{children}</div>
		</div>
	);
}
