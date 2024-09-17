import type {
	CommunityMemberPayload,
	PubPayload,
	StagePayload,
} from "~/lib/server/_legacy-integration-queries";
import Assign from "./Assign";
import Move from "./Move";

type Props = {
	members: CommunityMemberPayload[];
	pub: PubPayload;
	stage: StagePayload;
	communityStages: StagePayload[];
};

export const StagePubActions = (props: Props) => {
	return (
		<div className="flex shrink-0 items-end gap-2">
			<Move pub={props.pub} stage={props.stage} communityStages={props.communityStages} />
			<Assign members={props.members} pub={props.pub} />
		</div>
	);
};
