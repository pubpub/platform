"use client";

import type { ZodObject } from "zod";

import { useCallback } from "react";

import AutoForm, { AutoFormSubmit } from "ui/auto-form";
import { TokenProvider } from "ui/tokens";

import type { Action } from "~/actions/types";
import type { ActionInstances, ActionInstancesId } from "~/kysely/types/public/ActionInstances";
import { updateAction } from "../../actions";

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
		<TokenProvider tokens={props.action.tokens ?? {}}>
			<AutoForm
				values={props.instance.config ?? {}}
				formSchema={props.action.config as ZodObject<{}>}
				onSubmit={onSubmit}
			>
				<AutoFormSubmit>Update config</AutoFormSubmit>
			</AutoForm>
		</TokenProvider>
	);
};
