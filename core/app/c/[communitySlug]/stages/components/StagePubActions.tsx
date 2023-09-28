import React, { use } from "react";
import { Button } from "ui";
import {
	PermissionPayloadUser,
	PubPayload,
	StagePayload,
	StagePayloadMoveConstraintDestination,
	UserLoginData,
} from "~/lib/types";
import Move from "./Move";
import Assign from "./Assign";

type Props = {
	users: PermissionPayloadUser[];
	pub: PubPayload;
	stages: StagePayloadMoveConstraintDestination[];
	stage: StagePayload;
	loginData: UserLoginData;
};

export const StagePubActions = (props: Props) => {
	return (
		<div className="flex items-end shrink-0">
			<Move pub={props.pub} stage={props.stage} stages={props.stages} />
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
