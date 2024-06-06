"use client";

import React, { Suspense, use, useCallback, useMemo, useTransition } from "react";

import type { FieldConfig } from "ui/auto-form";
import { logger } from "logger";
import AutoForm, { AutoFormSubmit } from "ui/auto-form";
import { Button } from "ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "ui/dialog";
import { Loader2, Play } from "ui/icon";
import { toast } from "ui/use-toast";

import type { StagePub } from "./queries";
import type { Action } from "~/actions/types";
import type { ActionInstances, ActionInstancesId } from "~/kysely/types/public/ActionInstances";
import type { PubsId } from "~/kysely/types/public/Pubs";
import { resolveFieldConfig } from "~/actions/_lib/resolveFieldConfig";
import { getActionByName } from "~/actions/api";
import { runActionInstance } from "~/actions/api/serverAction";
import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard";
import { useServerAction } from "~/lib/serverActions";

export const StagePanelPubsRunActionButton = ({
	actionInstance,
	pub,
}: {
	actionInstance: ActionInstances;
	pub: StagePub;
}) => {
	const runAction = useServerAction(runActionInstance);

	const [isPending, startTransition] = useTransition();

	const action = getActionByName(actionInstance.action);

	if (!action) {
		logger.info(`Invalid action name ${actionInstance.action}`);
		return null;
	}

	const onSubmit = useCallback(
		async (values) => {
			startTransition(async () => {
				const result = await runAction({
					actionInstanceId: actionInstance.id as ActionInstancesId,
					pubId: pub.id as PubsId,
					actionInstanceArgs: values,
				});

				if ("success" in result) {
					toast({
						title: "Action ran successfully!",
						variant: "default",
						// TODO: SHOULD ABSOLUTELY BE SANITIZED
						description: (
							<div dangerouslySetInnerHTML={{ __html: result.report ?? "" }} />
						),
					});
				}
			});
		},
		[runAction, actionInstance.id, pub.id]
	);

	const resolvedFieldConfigPromise = useMemo(
		() => resolveFieldConfig(action, "config"),
		[action]
	);

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button
					variant="ghost"
					className="flex w-full items-center justify-start gap-x-4 px-4 py-2"
				>
					<action.icon size="14" className="flex-shrink-0" />
					<span className="overflow-auto text-ellipsis">
						{actionInstance.name || action.name}
					</span>
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-full overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{actionInstance.name || action.name}</DialogTitle>
				</DialogHeader>
				<Suspense fallback={<SkeletonCard />}>
					<ActionRunFormInner
						action={action}
						isPending={isPending}
						onSubmit={onSubmit}
						resolvedFieldConfigPromise={resolvedFieldConfigPromise}
						instance={actionInstance}
					/>
				</Suspense>
			</DialogContent>
		</Dialog>
	);
};

const ActionRunFormInner = React.memo(
	({
		resolvedFieldConfigPromise,
		action,
		onSubmit,
		instance,
		isPending,
	}: {
		action: Action;
		resolvedFieldConfigPromise: Promise<FieldConfig<any> | undefined>;
		onSubmit;
		instance: ActionInstances;
		isPending: boolean;
	}) => {
		const resolvedConfig = use(resolvedFieldConfigPromise);

		return (
			<AutoForm
				values={instance.config ?? {}}
				fieldConfig={resolvedConfig}
				formSchema={action.config.schema}
				dependencies={action.config.dependencies}
				onSubmit={onSubmit}
			>
				<AutoFormSubmit disabled={isPending} className="flex items-center gap-x-2">
					{isPending ? (
						<Loader2 size="14" className="animate-spin" />
					) : (
						<>
							<Play size="14" /> Run
						</>
					)}
				</AutoFormSubmit>
			</AutoForm>
		);
	}
);
