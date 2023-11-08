import {
	PermissionPayloadUser,
	PubPayload,
	StagePayload,
	StagePayloadMoveConstraintDestination,
	StagePayloadMoveConstraintDestinationFrom,
	UserLoginData,
} from "~/lib/types";
import Assign from "./Assign";
import Move from "./Move";

type Props = {
	users: PermissionPayloadUser[];
	pub: PubPayload;
	stages: StagePayloadMoveConstraintDestination[];
	stagesToMoveBackFrom: StagePayloadMoveConstraintDestinationFrom[];
	stage: StagePayload;
	loginData: UserLoginData;
};

export const StagePubActions = (props: Props) => {
	return (
		<div className="flex items-end shrink-0">
			{props.stages.length > 0 && (
				<Move pub={props.pub} stage={props.stage} stages={props.stages} />
			)}
			{props.stagesToMoveBackFrom.length > 0 && (
				<Move
					pub={props.pub}
					stage={props.stage}
					stagesToMoveBackFrom={props.stagesToMoveBackFrom}
				/>
			)}
			<Assign
				pub={props.pub}
				loginData={props.loginData}
				stage={props.stage}
				stages={props.stages}
				users={props.users}
			/>
		</div>
	);
};
