"use client";

import { startTransition, useEffect, useState, useTransition } from "react";
import { Action, ActionInstance, Pub } from "@prisma/client";
import { useFormState, useFormStatus } from "react-dom";

import { Button } from "ui/button";
import { Check, Loader2, Play } from "ui/icon";

import { ActionInstancesId } from "~/kysely/types/public/ActionInstances";
import { PubsId } from "~/kysely/types/public/Pubs";
import { useServerAction } from "~/lib/serverActions";
import * as actions from "../../actions";

export const StagePanelPubsRunActionButton = ({
	actionInstance,
	pub,
}: {
	actionInstance: ActionInstance & { action: Action };
	pub: Pub;
}) => {
	const runAction = useServerAction(actions.runAction);

	const [isPending, startTransition] = useTransition();
	const [result, setResult] = useState(undefined);

	useEffect(() => {
		if (result) {
			setTimeout(() => {
				setResult(undefined);
			}, 2000);
		}
	}, [result]);

	return (
		<div className="flex w-full items-center justify-between space-x-2 px-4 py-2">
			{actionInstance.action.name}
			<Button
				variant="default"
				type="button"
				size="sm"
				onClick={async (evt) => {
					if (isPending || result) return;
					startTransition(async () => {
						setResult(undefined);
						console.log("Running action");
						const res = await runAction({
							actionInstanceId: actionInstance.id as ActionInstancesId,
							pubId: pub.id as PubsId,
						});
						console.log("Action run finished");
						setResult(res);
					});
				}}
			>
				{isPending ? (
					<Loader2 size="14" className="animate-spin" />
				) : result ? (
					<Check size="14" />
				) : (
					<Play size="14" />
				)}
			</Button>
		</div>
	);
};
