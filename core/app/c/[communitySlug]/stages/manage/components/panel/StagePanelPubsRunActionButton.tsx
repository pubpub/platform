"use client";

import type { Action, ActionInstance, Pub } from "@prisma/client";

import { useEffect, useState, useTransition } from "react";

import { logger } from "logger";
import AutoForm from "ui/auto-form";
import { Button } from "ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "ui/dialog";
import { Check, Loader2, Play, X } from "ui/icon";
import { toast } from "ui/use-toast";

import type { ActionInstancesId } from "~/kysely/types/public/ActionInstances";
import type { PubsId } from "~/kysely/types/public/Pubs";
import { getActionByName } from "~/actions/api";
import { runActionInstance } from "~/actions/api/server";
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
	const [result, setResult] = useState<Awaited<ReturnType<typeof runAction>> | undefined>(
		undefined
	);

	const action = getActionByName(actionInstance.action);

	if (!action) {
		logger.info(`Invalid action name ${actionInstance.action}`);
		return null;
	}
	useEffect(() => {
		if (!result) {
			return;
		}

		if ("success" in result) {
			toast({
				title: "Action ran successfully!",
				variant: "default",
				description: result.report,
			});
		}

		const timeout = setTimeout(() => {
			setResult(undefined);
		}, 2000);

		return () => clearTimeout(timeout);
	}, [result]);

	return (
		<div className="flex w-full items-center justify-between space-x-2 px-4 py-2">
			<action.icon size="14" className="flex-shrink-0" />
			<span className="flex-grow overflow-auto text-ellipsis">
				{actionInstance.name || action.name}
			</span>
			<Dialog>
				<DialogTrigger asChild>
					<Button variant="default" type="button" size="sm">
						{isPending ? (
							<Loader2 size="14" className="animate-spin" />
						) : result ? (
							"error" in result ? (
								<X size="14" />
							) : (
								<Check size="14" />
							)
						) : (
							<Play size="14" />
						)}
					</Button>
				</DialogTrigger>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{actionInstance.name || action.name}</DialogTitle>
					</DialogHeader>
					<AutoForm formSchema={action.runParameters} />
				</DialogContent>
			</Dialog>
		</div>
	);
};
