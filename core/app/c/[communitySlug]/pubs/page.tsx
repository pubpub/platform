import { Prisma } from "@prisma/client";
import prisma from "@/core/prisma/db";
import PubList from "./PubList";
import PubHeader from "./PubHeader";

export type PubsData = Prisma.PromiseReturnType<typeof getCommunityPubs>;

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
			pubType: true,
			values: { include: { field: true } },
			stages: { include: { integrationInstances: { include: { integration: true } } } },
			integrationInstances: { include: { integration: true } },
		},
	});
};

type Props = { params: { communitySlug: string } };

export default async function Page({ params }: Props) {
	const pubs = await getCommunityPubs(params.communitySlug);
	if (!pubs) {
		return null;
	}
	return (
		<>
			<PubHeader />
			<PubList pubs={pubs} />
		</>
	);
}
