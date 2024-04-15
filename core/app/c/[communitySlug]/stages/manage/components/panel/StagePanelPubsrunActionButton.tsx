"use client";

import type { Action, ActionInstance, Pub } from "@prisma/client";

import { startTransition, useEffect, useState, useTransition } from "react";

import { logger } from "logger";
import { Button } from "ui/button";
import { Check, Loader2, Play, X } from "ui/icon";

import type { ActionInstancesId } from "~/kysely/types/public/ActionInstances";
import type { PubsId } from "~/kysely/types/public/Pubs";
import { getActionByName } from "~/actions/api";
import { runActionInstance } from "~/actions/api/runActionInstance";
import { useServerAction } from "~/lib/serverActions";

export const StagePanelPubsRunActionButton = ({
	actionInstance,
	pub,
}: {
	actionInstance: ActionInstance & { action: Action };
	pub: Pub;
}) => {
	const runAction = useServerAction(runActionInstance);

	const [isPending, startTransition] = useTransition();
	const [result, setResult] = useState(undefined);

	const action = getActionByName(actionInstance.action.name);

	if (!action) {
		logger.info(`Invalid action name ${actionInstance.action.name}`);
		return null;
	}
	useEffect(() => {
		if (result) {
			setTimeout(() => {
				setResult(undefined);
			}, 2000);
		}
	}, [result]);

	return (
		<div className="flex w-full items-center justify-between space-x-2 px-4 py-2">
			<div className="flex items-center gap-2">
				<action.icon size="14" />
				{actionInstance.action.name}
			</div>
			<Button
				variant="default"
				type="button"
				size="sm"
				onClick={async (evt) => {
					if (isPending || result) return;
					startTransition(async () => {
						setResult(undefined);
						const res = await runAction({
							actionInstanceId: actionInstance.id as ActionInstancesId,
							pubId: pub.id as PubsId,
							pubConfig: {},
						});
						setResult(res);
					});
				}}
			>
				{isPending ? (
					<Loader2 size="14" className="animate-spin" />
				) : result ? (
					result.error ? (
						<X size="14" />
					) : (
						<Check size="14" />
					)
				) : (
					<Play size="14" />
				)}
			</Button>
		</div>
	);
};
