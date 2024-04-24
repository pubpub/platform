"use client";

import type { ZodObject } from "zod";

import { useCallback } from "react";

import AutoForm, { AutoFormSubmit } from "ui/auto-form";

import type { Action } from "~/actions/types";
import type { ActionInstances, ActionInstancesId } from "~/kysely/types/public/ActionInstances";
import { updateAction } from "../../actions";
import { MapFieldConfig } from "./StagePanelPubsRunActionButton";

export type Props = {
	action: Action;
	instance: ActionInstances;
	communityId: string;
};

export const StagePanelActionConfig = (props: Props) => {
	const onSubmit = useCallback(
		(instanceConfig) => {
			updateAction(props.communityId, props.instance.id as ActionInstancesId, {
				config: instanceConfig,
			});
		},
		[props.communityId, props.instance.id]
	);

	return (
		<AutoForm
			values={props.instance.config ?? {}}
			fieldConfig={
				"fieldConfig" in props.action.config ? props.action.config.fieldConfig : undefined
			}
			formSchema={
				"schema" in props.action.config
					? (props.action.config.schema as ZodObject<{}>)
					: (props.action.config as ZodObject<{}>)
			}
			dependencies={
				"dependencies" in props.action.config ? props.action.config.dependencies : undefined
			}
			onSubmit={onSubmit}
		>
			<AutoFormSubmit>Update config</AutoFormSubmit>
		</AutoForm>
	);
};
