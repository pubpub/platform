import { Prisma } from "@prisma/client";
import prisma from "~/prisma/db";
import { getLoginData } from "~/lib/auth/loginData";
import PubList from "./PubList";
import PubHeader from "./PubHeader";
import { createToken } from "~/lib/server/token";
import { pubInclude } from "~/lib/types";

const getCommunityPubs = async (communitySlug: string) => {
	const community = await prisma.community.findUnique({
		where: { slug: communitySlug },
	});
	if (!community) {
		return null;
	}
	return await prisma.pub.findMany({
		where: { communityId: community.id },
		include: {
			...pubInclude,
		},
	});
};

type Props = { params: { communitySlug: string } };

export default async function Page({ params }: Props) {
	const loginData = await getLoginData();
	let token;
	if (loginData) {
		token = await createToken(loginData.id);
	}
	const pubs = await getCommunityPubs(params.communitySlug);
	if (!pubs) {
		return null;
	}
	return (
		<>
			<PubHeader />
			<PubList pubs={pubs} token={token} />
		</>
	);
}
