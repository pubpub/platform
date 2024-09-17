import type {
	CommunityMemberPayload,
	PubPayload,
	StagePayloadMoveConstraintDestination,
} from "~/lib/server/_legacy-integration-queries";
import type { StageThingy } from "~/lib/stages";
import { getMembers } from "~/lib/server/member";
import Assign from "./Assign";
import Move from "./Move";

type Props = {
	members: CommunityMemberPayload[];
	pub: PubPayload;
	stage: StageThingy;
};

export const StagePubActions = async (props: Props) => {
	const communityMembers = await getMembers({ communityId: props.stage.communityId }).execute();
	return (
		<div className="flex shrink-0 items-end gap-2">
			<Move
				pub={props.pub}
				stage={props.stage}
				moveTo={props.moveTo}
				moveFrom={props.moveFrom}
			/>
			<Assign members={communityMembers} pub={props.pub} />
		</div>
	);
};
