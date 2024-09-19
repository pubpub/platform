import "server-only";

import { cache } from "react";

import type { CommunitiesId } from "db/public";

import type { MemberWithUser, PubWithValues } from "~/lib/types";
import { getMembers } from "~/lib/server/member";
import Assign from "./Assign";

// Necessary in order to dedupe this query
const cachedGetMembers = cache((communityId: CommunitiesId) =>
	getMembers({ communityId: communityId }).execute()
);

export const AssignWrapper = async (props: { pub: PubWithValues; members?: MemberWithUser[] }) => {
	const members = props.members ?? (await cachedGetMembers(props.pub.communityId));

	return <Assign members={members} pub={props.pub} />;
};
