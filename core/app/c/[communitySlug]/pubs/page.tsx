import { Prisma } from "@prisma/client";
import prisma from "~/prisma/db";
import PubList from "./PubList";
import PubHeader from "./PubHeader";
import { commonPubQuery } from "~/lib/server/pub";
import { DefaultArgs } from "@prisma/client/runtime/library";

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
		...commonPubQuery,
	});
};

type X = Prisma.PubInclude<DefaultArgs>;

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
