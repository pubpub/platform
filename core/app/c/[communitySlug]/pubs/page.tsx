import type { Metadata } from "next";

import { Suspense } from "react";

import type { CommunitiesId, UsersId } from "db/public";
import { AuthTokenType } from "db/public";

import { getPageLoginData } from "~/lib/auth/loginData";
import { findCommunityBySlug } from "~/lib/server/community";
import { createToken } from "~/lib/server/token";
import PubHeader from "./PubHeader";
import PubList from "./PubList";

export const metadata: Metadata = {
	title: "Pubs",
};

type Props = { params: { communitySlug: string } };

export default async function Page({ params }: Props) {
	const { user } = await getPageLoginData();

	const community = await findCommunityBySlug(params.communitySlug);

	if (!community) {
		return null;
	}

	const tokenPromise = createToken({
		userId: user.id as UsersId,
		type: AuthTokenType.generic,
	});

	return (
		<>
			<PubHeader communityId={community.id as CommunitiesId} />
			<PubList communityId={community.id} token={tokenPromise} />
		</>
	);
}
