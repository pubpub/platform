"use client";

import type { z } from "zod";

import { startTransition, useCallback, useMemo } from "react";

import type { ActionInstances, ActionInstancesId, Action as ActionName, StagesId } from "db/public";
import AutoForm, { AutoFormSubmit } from "ui/auto-form";
import { TokenProvider } from "ui/tokens";
import { toast } from "ui/use-toast";

import { getActionByName } from "~/actions/api";
import { updateAction } from "~/app/c/[communitySlug]/stages/manage/actions";
import { useServerAction } from "~/lib/serverActions";
import { useCommunity } from "../providers/CommunityProvider";
import { createDefaultFieldConfig } from "./defaultFieldConfig";

export type Props = {
	actionInstance: ActionInstances;
	stageId: StagesId;
	defaultFields: string[];
};

export const ActionConfigForm = (props: Props) => {
	const community = useCommunity();
	const action = getActionByName(props.actionInstance.action);

	const fieldConfig = action.config.fieldConfig ?? {};
	const fieldConfigWithDefaults = createDefaultFieldConfig(props.defaultFields, fieldConfig);

	const schema = useMemo(() => {
		const schemaWithPartialDefaults = (action.config.schema as z.ZodObject<any>).partial(
			props.defaultFields.reduce(
				(acc, key) => {
					acc[key] = true;
					return acc;
				},
				{} as Record<string, true>
			)
		);
		return schemaWithPartialDefaults;
	}, [action.config.schema, props.defaultFields]);

	const runUpdateAction = useServerAction(updateAction);

	const onSubmit = useCallback(
		async (values: z.infer<typeof schema>) => {
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
			});
		},
		[runUpdateAction, props.actionInstance.id, community.id]
	);

	return (
		<TokenProvider tokens={action.tokens ?? {}}>
			<AutoForm
				values={props.actionInstance.config ?? {}}
				fieldConfig={fieldConfigWithDefaults}
				formSchema={schema}
				dependencies={action.config.dependencies}
				onSubmit={onSubmit}
			>
				<AutoFormSubmit>Update config</AutoFormSubmit>
			</AutoForm>
		</TokenProvider>
	);
};
