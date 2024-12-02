import type { Metadata } from "next";

import { ActionRunDialog } from "~/app/components/ActionUI/ActionRunDialog";
import { PubEditorDialog } from "~/app/components/pubs/PubEditor/PubEditorDialog";
import { getPageLoginData } from "~/lib/authentication/loginData";
import { findCommunityBySlug } from "~/lib/server/community";
import { PubHeader } from "./PubHeader";
import { PaginatedPubList } from "./PubList";

export const metadata: Metadata = {
	title: "Pubs",
};

type Props = {
	params: { communitySlug: string };
	searchParams: Record<string, string | string[] | undefined> & { page?: string };
};

export default async function Page({ params, searchParams }: Props) {
	const { user } = await getPageLoginData();

	const community = await findCommunityBySlug(params.communitySlug);

	if (!community) {
		return null;
	}

	const page = searchParams.page ? parseInt(searchParams.page) : 1;

	// const tokenPromise = createToken({
	// 	userId: user.id as UsersId,
	// 	type: AuthTokenType.generic,
	// });

	const basePath = `/c/${community.slug}/pubs`;

	return (
		<>
			<PubHeader />
			<PaginatedPubList
				communityId={community.id}
				searchParams={searchParams}
				page={page}
				basePath={basePath}
			/>
			<PubEditorDialog searchParams={searchParams} />
			<ActionRunDialog pageContext={{ searchParams, params }} />
		</>
	);
}
