import type { Metadata } from "next";

import type { CommunitiesId, UsersId } from "db/public";
import { AuthTokenType } from "db/public";

import { PubEditorDialog } from "~/app/components/pubs/PubEditor/PubEditorDialog";
import { getPageLoginData } from "~/lib/auth/loginData";
import { findCommunityBySlug } from "~/lib/server/community";
import { setupPathAwareDialogSearchParamCache } from "~/lib/server/pathAwareDialogParams";
import { createToken } from "~/lib/server/token";
import PubHeader from "./PubHeader";
import PubList from "./PubList";

export const metadata: Metadata = {
	title: "Pubs",
};

type Props = {
	params: { communitySlug: string };
	searchParams: Record<string, string | string[] | undefined>;
};

export default async function Page({ params, searchParams }: Props) {
	const { user } = await getPageLoginData();

	const community = await findCommunityBySlug(params.communitySlug);

	if (!community) {
		return null;
	}

	const tokenPromise = createToken({
		userId: user.id as UsersId,
		type: AuthTokenType.generic,
	});

	setupPathAwareDialogSearchParamCache(searchParams);

	return (
		<>
			<PubHeader communityId={community.id as CommunitiesId} searchParams={searchParams} />
			<PubList communityId={community.id} token={tokenPromise} searchParams={searchParams} />
			<PubEditorDialog searchParams={searchParams} />
		</>
	);
}
