import { redirect } from "next/navigation";

import type { CommunitiesId } from "db/public";

import { getLoginData } from "~/lib/auth/loginData";
import { createToken } from "~/lib/server/token";
import { pubInclude, stageInclude } from "~/lib/types";
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

const getStages = async (communityId: string) => {
	// When trying to render the workflows a member can see. We look at the pubs they can see, get the workflows associated, and then show all those.
	return await prisma.stage.findMany({
		where: { communityId: communityId },
		include: stageInclude,
	});
};

type Props = { params: { communitySlug: string }; searchParams?: Record<string, unknown> };

export default async function Page({ params, searchParams }: Props) {
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

	const [pubs, stages] = await Promise.all([
		getCommunityPubs(community.id),
		getStages(community.id),
	]);

	return (
		<>
			<PubHeader communityId={community.id as CommunitiesId} searchParams={searchParams} />
			<PubList pubs={pubs} token={token} />
		</>
	);
}
