import "server-only";

import type { MemberWithUser, PubWithValues } from "~/lib/types";
import { getMembers } from "~/lib/server/member";
import Assign from "./Assign";

export const AssignWrapper = async (props: { pub: PubWithValues; members?: MemberWithUser[] }) => {
	const members =
		props.members ?? (await getMembers({ communityId: props.pub.communityId }).execute());

	return <Assign members={members} pub={props.pub} />;
};
