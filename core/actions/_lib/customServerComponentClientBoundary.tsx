"use client";

import { useCallback } from "react";

import AutoForm, { AutoFormSubmit } from "ui/auto-form";

import { updateAction } from "~/app/c/[communitySlug]/stages/manage/actions";
import Action from "~/kysely/types/public/Action";
import { ActionInstances, ActionInstancesId } from "~/kysely/types/public/ActionInstances";
import { CommunitiesId } from "~/kysely/types/public/Communities";
import { useServerAction } from "~/lib/serverActions";
import { getActionByName } from "../api";

export const CustomServerComponentClientBoundary = ({
	actionName,
	config,
	fieldConfig,
	omittedFields,
	onUpdateAction,
}: {
	actionName: Action;
	config;
	fieldConfig: React.ReactNode;
	omittedFields: { [key: string]: true };
	onUpdateAction: ({ config }: { config: Record<string, any> }) => Promise<unknown>;
}) => {
	const {
		config: { schema, dependencies, fieldConfig: otherFieldConfig },
	} = getActionByName(actionName);

	const useUpdate = useServerAction(onUpdateAction);

	const onSubmit = useCallback(
		(instanceConfig) => {
			useUpdate({
				config: instanceConfig,
			});
		},
		[onUpdateAction]
	);

	return (
		<AutoForm
			values={config ?? {}}
			fieldConfig={otherFieldConfig}
			//			fieldConfig={props.action.config.fieldConfig}
			// formSchema={innerSchema.omit(omittedFields)}
			formSchema={schema}
			dependencies={dependencies}
			onSubmit={onSubmit}
		>
			{fieldConfig}
			<AutoFormSubmit>Save</AutoFormSubmit>
		</AutoForm>
	);
};
