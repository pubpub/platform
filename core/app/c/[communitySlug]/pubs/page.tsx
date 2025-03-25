import type { Metadata } from "next";

import type { CommunitiesId } from "db/public";

import { PubsDataTable } from "~/app/components/DataTable/PubsDataTable/PubsDataTable";
import { getPageLoginData } from "~/lib/authentication/loginData";
import { findCommunityBySlug } from "~/lib/server/community";
import PubHeader from "./PubHeader";
import { PaginatedPubList } from "./PubList";

export const metadata: Metadata = {
	title: "Pubs",
};

type Props = {
	params: Promise<{ communitySlug: string }>;
	searchParams: Record<string, unknown> & { page?: string };
};

export default async function Page(props: Props) {
	const searchParams = await props.searchParams;
	const params = await props.params;
	const { user } = await getPageLoginData();

	const community = await findCommunityBySlug(params.communitySlug);

	if (!community) {
		return null;
	}

	const page = searchParams.page ? parseInt(searchParams.page) : 1;

	const basePath = `/c/${community.slug}/pubs`;

	return (
		<>
			<PubsDataTable
				communityId={community.id}
				userId={user.id}
				searchParams={searchParams}
			/>
			<PubHeader communityId={community.id as CommunitiesId} />
			<PaginatedPubList
				communityId={community.id}
				searchParams={searchParams}
				page={page}
				basePath={basePath}
				userId={user.id}
			/>
		</>
	);
}
