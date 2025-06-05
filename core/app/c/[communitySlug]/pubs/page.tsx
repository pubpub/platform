import type { Metadata } from "next";

import type { CommunitiesId } from "db/public";

import { FooterPagination } from "~/app/components/Pagination";
import { getPageLoginData } from "~/lib/authentication/loginData";
import { env } from "~/lib/env/env";
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
		// Position absolute to remove the parent layout padding so that the footer can hug the bottom properly
		<div className="absolute bottom-0 left-0 right-0 top-0">
			{/* Restore layout padding, but give extra bottom padding so that last item is not covered by the footer */}
			<div className="mb-4 max-h-screen overflow-y-scroll px-4 py-4 pb-16 md:px-12">
				<PubHeader communityId={community.id as CommunitiesId} />
				<PaginatedPubList
					communityId={community.id}
					searchParams={searchParams}
					page={page}
					basePath={basePath}
					userId={user.id}
				/>
			</div>
		</div>
	);
}
