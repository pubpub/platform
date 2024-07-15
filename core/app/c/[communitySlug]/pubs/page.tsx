import { redirect } from "next/navigation";

import type { CommunitiesId } from "db/public";

import { getLoginData } from "~/lib/auth/loginData";
import { createToken } from "~/lib/server/token";
import { pubInclude } from "~/lib/types";
import prisma from "~/prisma/db";
import PubHeader from "./PubHeader";
import PubList from "./PubList";

const getCommunityPubs = async (communityId: string) => {
	return await prisma.pub.findMany({
		where: { communityId: communityId },
		include: {
			...pubInclude,
		},
	});
};

type Props = { params: { communitySlug: string } };

export default async function Page({ params }: Props) {
	const loginData = await getLoginData();
	if (!loginData) {
		redirect("/login");
	}
	const community = await prisma.community.findUnique({
		where: { slug: params.communitySlug },
	});

	if (!community) {
		return null;
	}

	const token = await createToken(loginData.id);
	const pubs = await getCommunityPubs(community.id);

	return (
		<>
			<PubHeader communityId={community.id as CommunitiesId} />
			<PubList pubs={pubs} token={token} />
		</>
	);
}
