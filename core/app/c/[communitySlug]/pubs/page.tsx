import type { Metadata } from "next";

import type { UsersId } from "db/public";
import { AuthTokenType } from "db/public";

import { ActionRunDialog } from "~/app/components/ActionUI/ActionRunDialog";
import { PubEditorDialog } from "~/app/components/pubs/PubEditor/PubEditorDialog";
import { getPageLoginData } from "~/lib/auth/loginData";
import { findCommunityBySlug } from "~/lib/server/community";
import { createToken } from "~/lib/server/token";
import { PubHeader } from "./PubHeader";
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

	return (
		<>
			<PubHeader />
			<PubList communityId={community.id} token={tokenPromise} />
			<PubEditorDialog searchParams={searchParams} />
			<ActionRunDialog pageContext={{ searchParams, params }} />
		</>
	);
}
