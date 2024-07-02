import type {
	CommunityMemberPayload,
	PubPayload,
	StagePayload,
	StagePayloadMoveConstraintDestination,
	UserLoginData,
} from "~/lib/types";
import Assign from "./Assign";
import Move from "./Move";

type Props = {
	loginData: UserLoginData;
	members: CommunityMemberPayload[];
	moveFrom: StagePayloadMoveConstraintDestination[];
	moveTo: StagePayloadMoveConstraintDestination[];
	pub: PubPayload;
	stage: StagePayload;
};

export const StagePubActions = (props: Props) => {
	return (
		<div className="flex shrink-0 items-end gap-2">
			<Move
				pub={props.pub}
				stage={props.stage}
				moveTo={props.moveTo}
				moveFrom={props.moveFrom}
			/>
			<Assign members={props.members} pub={props.pub} />
		</div>
	);
};
