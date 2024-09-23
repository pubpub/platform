import { Metadata } from "next";

import type { CommunitiesId, UsersId } from "db/public";
import { AuthTokenType } from "db/public";

import { PubCRUDModal } from "~/app/components/PubCRUD/PubCRUDModal";
import { getLoginData, getPageLoginData } from "~/lib/auth/loginData";
import { pubInclude, stageInclude } from "~/lib/server/_legacy-integration-queries";
import { modalSearchParamsCache } from "~/lib/server/modal";
import { createToken } from "~/lib/server/token";
import prisma from "~/prisma/db";
import PubHeader from "./PubHeader";
import PubList from "./PubList";

export const metadata: Metadata = {
	title: "Pubs",
};

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

type Props = {
	params: { communitySlug: string };
	searchParams: Record<string, string | string[] | undefined>;
};

export default async function Page({ params, searchParams }: Props) {
	const { user } = await getPageLoginData();

	const community = await prisma.community.findUnique({
		where: { slug: params.communitySlug },
	});

	if (!community) {
		return null;
	}

	modalSearchParamsCache.parse(searchParams);

	const token = await createToken({
		userId: user.id as UsersId,
		type: AuthTokenType.generic,
	});

	const [pubs, stages] = await Promise.all([
		getCommunityPubs(community.id),
		getStages(community.id),
	]);

	return (
		<>
			<PubHeader />
			<PubList pubs={pubs} token={token} />
			<PubCRUDModal />
		</>
	);
}
