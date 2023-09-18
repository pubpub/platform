"use client";
import React from "react";
import { Button } from "ui";
import {
	PermissionPayloadUser,
	PubPayload,
	StagePayload,
	StagesCanMoveFromOrTo,
	User,
} from "~/lib/types";
import Move from "./Move";
import Assign from "./Assign";

type Props = {
	users: PermissionPayloadUser[];
	pub: PubPayload;
	stages: StagesCanMoveFromOrTo[];
	stage: StagePayload;
	loginData: User;
};

export const StagePubActions = (props: Props) => {
	const { users, pub, stage, loginData, stages } = props;

	return (
		<div className="flex items-end shrink-0">
			<Move pub={pub} stage={stage} stages={stages} />
			<Assign pub={pub} loginData={loginData} stage={stage} stages={stages} users={users} />
			<Button size="sm" variant="outline" className="ml-1">
				Email Members
			</Button>
		</div>
	);
};
