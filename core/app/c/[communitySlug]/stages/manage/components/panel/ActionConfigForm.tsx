"use client";

import type { ZodObject } from "zod";

import { startTransition, Suspense, use, useCallback, useMemo } from "react";

import AutoForm, { AutoFormSubmit, FieldConfig } from "ui/auto-form";
import { toast } from "ui/use-toast";

import type { Action } from "~/actions/types";
import type { ActionInstances, ActionInstancesId } from "~/kysely/types/public/ActionInstances";
import { resolveFieldConfig } from "~/actions/_lib/resolveFieldConfig";
import { getActionByName } from "~/actions/api";
import { default as ActionName } from "~/kysely/types/public/Action";
import { useServerAction } from "~/lib/serverActions";
import { updateAction } from "../../actions";

export type Props = {
	actionName: ActionName;
	instance: ActionInstances;
	communityId: string;
	fieldConfig;
};

export const ActionConfigForm = (props: Props) => {
	console.log(props.fieldConfig);
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

	// const resolvedFieldConfigPromise = useMemo(
	// 	() => resolveFieldConfig(action, "config"),
	// 	[action]
	// );

	return (
		<Suspense fallback={<div>Loading...</div>}>
			<ActionConfigFormInner
				action={action}
				onSubmit={onSubmit}
				fieldConfig={props.fieldConfig}
				//		resolvedFieldConfigPromise={resolvedFieldConfigPromise}
				instance={props.instance}
			/>
		</Suspense>
	);
};

const ActionConfigFormInner = ({
	// resolvedFieldConfigPromise,
	action,
	onSubmit,
	fieldConfig,
	instance,
}: {
	action: Action;
	// resolvedFieldConfigPromise: Promise<FieldConfig<any> | undefined>;
	onSubmit;
	fieldConfig;
	instance: ActionInstances;
}) => {
	//	const resolvedConfig = use(resolvedFieldConfigPromise);

	return (
		<AutoForm
			values={instance.config ?? {}}
			fieldConfig={fieldConfig}
			formSchema={action.config.schema}
			dependencies={action.config.dependencies}
			onSubmit={onSubmit}
		>
			<AutoFormSubmit>Update config</AutoFormSubmit>
		</AutoForm>
	);
};
