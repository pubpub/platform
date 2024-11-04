"use client";

import type { z } from "zod";

import { startTransition, useCallback } from "react";

import type { ActionInstances, ActionInstancesId, Action as ActionName } from "db/public";
import type { FieldConfig } from "ui/auto-form";
import AutoForm, { AutoFormSubmit } from "ui/auto-form";
import { toast } from "ui/use-toast";

import { getActionByName } from "~/actions/api";
import { updateAction } from "~/app/c/[communitySlug]/stages/manage/actions";
import { useServerAction } from "~/lib/serverActions";

export type Props = {
	actionName: ActionName;
	instance: ActionInstances;
	communityId: string;
	fieldConfig: FieldConfig<any>;
};

export const ActionConfigForm = (props: Props) => {
	const action = getActionByName(props.actionName);

	const runUpdateAction = useServerAction(updateAction);

	const onSubmit = useCallback(
		async (values: z.infer<typeof action.config.schema>) => {
			startTransition(async () => {
				const result = await runUpdateAction(props.instance.id as ActionInstancesId, {
					config: values,
				});

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
		[runUpdateAction, props.instance.id, props.communityId]
	);

	return (
		<AutoForm
			values={props.instance.config ?? {}}
			fieldConfig={props.fieldConfig}
			formSchema={action.config.schema}
			dependencies={action.config.dependencies}
			onSubmit={onSubmit}
		>
			<AutoFormSubmit>Update config</AutoFormSubmit>
		</AutoForm>
	);
};
