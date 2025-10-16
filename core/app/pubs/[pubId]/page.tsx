import { notFound, redirect } from "next/navigation";

import type { PubsId } from "db/public";

import { getPlainPub } from "~/lib/server";
import { findCommunityByPubId } from "~/lib/server/community";

export type Props = {
	params: Promise<{
		pubId: PubsId;
	}>;
};

export default async function Page(props: Props) {
	const [pub, community] = await Promise.all([
		getPlainPub((await props.params).pubId).qb.executeTakeFirstOrThrow(),
		findCommunityByPubId((await props.params).pubId),
	]);

	if (!pub || !community) {
		notFound();
	}

	redirect(`/c/${community.slug}/pubs/${pub.id}`);
}
