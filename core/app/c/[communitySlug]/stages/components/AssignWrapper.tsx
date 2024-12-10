import "server-only";

import { cache } from "react";

import type { ProcessedPub } from "contracts";
import type { CommunitiesId } from "db/public";

import type { MemberWithUser } from "~/lib/types";
import { selectCommunityMembers } from "~/lib/server/member";
import Assign from "./Assign";

// Necessary in order to dedupe this query
const cachedGetMembers = cache((communityId: CommunitiesId) =>
	selectCommunityMembers({ communityId: communityId }).execute()
);

export const AssignWrapper = async (props: {
	pub: ProcessedPub<{
		withPubType: true;
		withLegacyAssignee: true;
		withRelatedValues: false;
		withChildren: undefined;
	}>;
	members?: MemberWithUser[];
}) => {
	const members = props.members ?? (await cachedGetMembers(props.pub.communityId));

	return <Assign members={members} pub={props.pub} />;
};
