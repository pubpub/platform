import {
	PermissionPayloadMember,
	PubPayload,
	StagePayload,
	StagePayloadMoveConstraintDestination,
	UserLoginData,
} from "~/lib/types";
import Assign from "./Assign";
import Move from "./Move";

type Props = {
	pub: PubPayload;
	moveTo: StagePayloadMoveConstraintDestination[];
	moveFrom: StagePayloadMoveConstraintDestination[];
	stage: StagePayload;
	loginData: UserLoginData;
};

export const StagePubActions = (props: Props) => {
	return (
		<div className="flex items-end shrink-0">
			<Move
				pub={props.pub}
				stage={props.stage}
				moveTo={props.moveTo}
				moveFrom={props.moveFrom}
			/>
			{props.pub.claims.length <= 0 && (
				<Assign
					pub={props.pub}
					loginData={props.loginData}
					stage={props.stage}
					stages={props.moveTo}
					members={props.pub.community.members}
				/>
			)}
		</div>
	);
};
