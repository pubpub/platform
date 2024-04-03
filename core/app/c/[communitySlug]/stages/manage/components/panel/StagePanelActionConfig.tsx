"use client";

import type { ZodObject } from "zod";

import AutoForm, { AutoFormSubmit } from "ui/auto-form";

import type { Action } from "~/actions/types";
import type { ActionInstancesId } from "~/kysely/types/public/ActionInstances";
import type { StagePayloadActionInstance } from "~/lib/types";
import { updateAction } from "../../actions";

export type Props = {
	action: Action;
	instance: StagePayloadActionInstance;
	communityId: string;
};

export const StagePanelActionConfig = (props: Props) => {
	return (
		<AutoForm
			values={props.instance.config ?? {}}
			formSchema={props.action.config as ZodObject<{}>}
			onSubmit={(instanceConfig) => {
				updateAction(
					props.communityId,
					props.instance.id as ActionInstancesId,
					instanceConfig
				);
			}}
		>
			<AutoFormSubmit>Update config</AutoFormSubmit>
		</AutoForm>
	);
};
