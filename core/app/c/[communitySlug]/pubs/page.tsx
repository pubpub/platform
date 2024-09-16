import { Metadata } from "next";
import { redirect } from "next/navigation";

import type { CommunitiesId, UsersId } from "db/public";
import { AuthTokenType } from "db/public";

import { getPageLoginData } from "~/lib/auth/loginData";
import { createToken } from "~/lib/server/token";
import { pubInclude } from "~/lib/types";
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

type Props = {
	params: { communitySlug: string };
	searchParams: { pubTypeId: string };
};

export default async function Page(props: Props) {
	const { user } = await getPageLoginData();

	const community = await prisma.community.findUnique({
		where: { slug: props.params.communitySlug },
	});

	if (!community) {
		return null;
	}

	const token = await createToken({
		userId: user.id as UsersId,
		type: AuthTokenType.generic,
	});

	const [pubs] = await Promise.all([getCommunityPubs(community.id)]);

	return (
		<>
			<PubHeader
				communityId={community.id as CommunitiesId}
				searchParams={props.searchParams}
			/>
			<PubList pubs={pubs} token={token} />
		</>
	);
}
