"use client";

import type { Pub } from "@prisma/client";
import type { ZodObject } from "zod";

import { useCallback, useTransition } from "react";

import { logger } from "logger";
import AutoForm, { AutoFormSubmit } from "ui/auto-form";
import { Button } from "ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "ui/dialog";
import { FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Loader2, Play } from "ui/icon";
import { Input } from "ui/input";
import { toast } from "ui/use-toast";

import type { StagePub } from "./queries";
import type { ActionInstances, ActionInstancesId } from "~/kysely/types/public/ActionInstances";
import type { PubsId } from "~/kysely/types/public/Pubs";
import { getActionByName } from "~/actions/api";
import { runActionInstance } from "~/actions/api/server";
import { useServerAction } from "~/lib/serverActions";

export const MapFieldConfig = ({
	pub,
	fieldConfig,
}: {
	pub: StagePub;
	fieldConfig: Record<string, any>;
}) =>
	Object.fromEntries(
		Object.entries(fieldConfig).map(([key, value]) => [
			key,
			{
				...value,
				fieldType: "fieldType" in value ? value.fieldType(pub) : undefined,
			},
		])
	);

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
					runParameters: values,
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
				<AutoForm
					formSchema={
						"schema" in action.runParameters
							? action.runParameters.schema
							: action.runParameters
					}
					onSubmit={onSubmit}
					dependencies={
						"dependencies" in action.runParameters
							? action.runParameters.dependencies
							: undefined
					}
					fieldConfig={{
						...("fieldConfig" in action.runParameters
							? MapFieldConfig({
									pub,
									fieldConfig: action.runParameters.fieldConfig ?? {},
								})
							: undefined),
					}}
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
			</DialogContent>
		</Dialog>
	);
};
