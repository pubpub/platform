"use client";

import type { z } from "zod";

import { useCallback, useTransition } from "react";

import type { ActionInstances, ActionInstancesId, PubsId } from "db/public";
import type { FieldConfig } from "ui/auto-form";
import { logger } from "logger";
import AutoForm, { AutoFormSubmit } from "ui/auto-form";
import { Loader2, Play } from "ui/icon";
import { toast } from "ui/use-toast";

import { getActionByName } from "~/actions/api";
import { runActionInstance } from "~/actions/api/serverAction";
import { useServerAction } from "~/lib/serverActions";

export const ActionRunForm = ({
	actionInstance,
	pubId,
	fieldConfig,
}: {
	actionInstance: ActionInstances;
	pubId: PubsId;
	fieldConfig: FieldConfig<any>;
}) => {
	const runAction = useServerAction(runActionInstance);

	const [isPending, startTransition] = useTransition();

	const action = getActionByName(actionInstance.action);

	if (!action) {
		logger.info(`Invalid action name ${actionInstance.action}`);
		return null;
	}

	const onSubmit = useCallback(
		async (values: z.infer<typeof action.params.schema>) => {
			startTransition(async () => {
				const result = await runAction({
					actionInstanceId: actionInstance.id as ActionInstancesId,
					pubId,
					actionInstanceArgs: values,
				});

				if ("success" in result) {
					toast({
						title: "Action ran successfully!",
						variant: "default",
						// TODO: SHOULD ABSOLUTELY BE SANITIZED
						description: (
							<div
								className="max-h-40 max-w-sm overflow-auto"
								dangerouslySetInnerHTML={{ __html: result.report ?? "" }}
							/>
						),
					});
				}
			});
		},
		[runAction, actionInstance.id, pubId]
	);

	return (
		<AutoForm
			values={actionInstance.config ?? {}}
			fieldConfig={fieldConfig}
			formSchema={action.params.schema}
			dependencies={action.params.dependencies}
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
};
