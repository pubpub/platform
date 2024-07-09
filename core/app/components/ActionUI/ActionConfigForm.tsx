"use client";

import { startTransition, useCallback } from "react";

import type { FieldConfig } from "ui/auto-form";
import AutoForm, { AutoFormSubmit } from "ui/auto-form";
import { toast } from "ui/use-toast";

import type { default as ActionName } from "~/kysely/types/public/Action";
import type { ActionInstances, ActionInstancesId } from "~/kysely/types/public/ActionInstances";
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
		async (values) => {
			startTransition(async () => {
				console.log(values);
				const result = await runUpdateAction(
					props.communityId,
					props.instance.id as ActionInstancesId,
					{ config: values }
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
