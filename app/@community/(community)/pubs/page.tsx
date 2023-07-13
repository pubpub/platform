import { Prisma } from "@prisma/client";
import prisma from "prisma/db";
import PubList from "./PubList";
import PubHeader from "./PubHeader";

export type PubsData = Prisma.PromiseReturnType<typeof getCommunityPubs>;

const getCommunityPubs = async () => {
	/* Normally, we would get the community based on the url or logged in user session */
	const onlyCommunity = await prisma.community.findFirst();
	if (!onlyCommunity) {
		return null;
	}
	return await prisma.pub.findMany({
		where: { communityId: onlyCommunity.id },
		include: {
			pubType: true,
			values: { include: { field: true } },
			stages: { include: { integrationInstances: { include: { integration: true } } } },
			integrationInstances: { include: { integration: true } },
		},
	});
};

export default async function Page() {
	const pubs = await getCommunityPubs();
	if (!pubs) {
		return null;
	}
	return (
		<>
			<PubHeader />

			<PubList pubs={pubs} top={true} />
		</>
	);
}
