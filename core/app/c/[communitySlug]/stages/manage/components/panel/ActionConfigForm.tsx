"use client";

import { startTransition, useCallback } from "react";

import type { default as ActionName } from "db/public/Action";
import type { ActionInstances, ActionInstancesId } from "db/public/ActionInstances";
import type { FieldConfig } from "ui/auto-form";
import AutoForm, { AutoFormSubmit } from "ui/auto-form";
import { TokenProvider } from "ui/tokens";
import { toast } from "ui/use-toast";

import { getActionByName } from "~/actions/api";
import { useServerAction } from "~/lib/serverActions";
import { updateAction } from "../../actions";

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
		<TokenProvider tokens={action.tokens ?? {}}>
			<AutoForm
				values={props.instance.config ?? {}}
				fieldConfig={props.fieldConfig}
				formSchema={action.config.schema}
				dependencies={action.config.dependencies}
				onSubmit={onSubmit}
			>
				<AutoFormSubmit>Update config</AutoFormSubmit>
			</AutoForm>
		</TokenProvider>
	);
};
