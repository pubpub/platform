import type { Metadata } from "next";

import type { CommunitiesId } from "db/public";

import { getPageLoginData } from "~/lib/authentication/loginData";
import { findCommunityBySlug } from "~/lib/server/community";
import PubHeader from "./PubHeader";
import { PaginatedPubList } from "./PubList";

export const metadata: Metadata = {
	title: "Pubs",
};

type Props = {
	params: { communitySlug: string };
	searchParams: Record<string, unknown> & { page?: string };
};

export default async function Page({ params, searchParams }: Props) {
	const { user } = await getPageLoginData();

	const community = await findCommunityBySlug(params.communitySlug);

	if (!community) {
		return null;
	}

	const page = searchParams.page ? parseInt(searchParams.page) : 1;

	const basePath = `/c/${community.slug}/pubs`;

	return (
		<>
			<PubHeader communityId={community.id as CommunitiesId} searchParams={searchParams} />
			<PaginatedPubList
				communityId={community.id}
				searchParams={searchParams}
				page={page}
				basePath={basePath}
			/>
		</>
	);
}
