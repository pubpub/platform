"use client";

import { Action, ActionInstance, Pub } from "@prisma/client";
import { useFormState, useFormStatus } from "react-dom";

import { Button } from "ui/button";
import { Loader2, Play } from "ui/icon";

import * as actions from "../../actions";

export const StagePanelPubsRunActionButton = ({
	action,
}: {
	action: ActionInstance & { action: Action };
	pub: Pub;
}) => {
	// const [state, dispatch] = useFormState(actions.runAction, undefined);
	const formStatus = useFormStatus();

	return (
		<form className="flex w-full items-center justify-between space-x-2 px-4 py-2">
			{action.action.name}
			<Button variant="default" size="sm">
				{formStatus.pending ? (
					<Loader2 size="14" className="animate-spin" />
				) : (
					<Play size="14" />
				)}
			</Button>
		</form>
	);
};
