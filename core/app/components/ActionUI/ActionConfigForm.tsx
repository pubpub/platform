"use client";

import type { z } from "zod";

import { startTransition, useCallback, useMemo } from "react";

import type { ActionInstances, ActionInstancesId, StagesId } from "db/public";
import { TokenProvider } from "ui/tokens";
import { toast } from "ui/use-toast";

import { ActionConfigBuilder } from "~/actions/_lib/ActionConfigBuilder";
import { ActionForm } from "~/actions/_lib/ActionForm";
import { getActionByName } from "~/actions/api";
import { getActionFormComponent } from "~/actions/forms";
import { deleteAction, updateAction } from "~/app/c/[communitySlug]/stages/manage/actions";
import { didSucceed, useServerAction } from "~/lib/serverActions";

export type Props = {
	actionInstance: ActionInstances;
	stageId: StagesId;
	defaultFields: string[];
};

export const ActionConfigForm = (props: Props) => {
	const action = getActionByName(props.actionInstance.action);
	const runDeleteAction = useServerAction(deleteAction);

	const onDelete = useCallback(async () => {
		const result = await runDeleteAction(
			props.actionInstance.id as ActionInstancesId,
			props.stageId
		);
		if (didSucceed(result)) {
			toast({
				title: "Action deleted successfully!",
			});
		}
	}, [props.actionInstance.id, props.stageId, runDeleteAction]);

	const schema = useMemo(() => {
		const config = new ActionConfigBuilder(action.name)
			.withConfig(props.actionInstance.config ?? {})
			.withDefaults(props.defaultFields)
			.getSchema();
		return config;
	}, [action.name, props.actionInstance.config, props.defaultFields]);

	const runUpdateAction = useServerAction(updateAction);

	const onSubmit = useCallback(
		async (values: z.infer<NonNullable<typeof schema>>) => {
			startTransition(async () => {
				const result = await runUpdateAction(
					props.actionInstance.id as ActionInstancesId,
					props.stageId,
					{
						config: values,
					}
				);

				if (result && "success" in result) {
					toast({
						title: "Action updated successfully!",
						variant: "default",
						// TODO: SHOULD ABSOLUTELY BE SANITIZED
						description: (
							<div dangerouslySetInnerHTML={{ __html: result.report ?? "" }} />
						),
					});
				}

				if (result && "success" in result) {
					toast({
						title: "Action updated successfully!",
						variant: "default",
						// TODO: SHOULD ABSOLUTELY BE SANITIZED
						description: (
							<div dangerouslySetInnerHTML={{ __html: result.report ?? "" }} />
						),
					});
				}
			});
		},
		[runUpdateAction, props.actionInstance.id, props.stageId]
	);

	const ActionFormComponent = getActionFormComponent(action.name);

	return (
		<TokenProvider tokens={action.tokens ?? {}}>
			<ActionForm
				action={action}
				values={props.actionInstance.config ?? {}}
				defaultFields={props.defaultFields}
				onSubmit={onSubmit}
				submitButton={{
					text: "Update Action",
					pendingText: "Updating Action...",
					successText: "Action Updated",
					errorText: "Failed to update action",
				}}
				secondaryButton={{
					text: "Remove Action",
					onClick: onDelete,
				}}
				context={{ type: "configure" }}
			>
				<ActionFormComponent />
			</ActionForm>
		</TokenProvider>
	);
};
