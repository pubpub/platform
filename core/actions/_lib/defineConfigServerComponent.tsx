import type { z } from "zod";

import React from "react";

import type { Dependency, FieldConfig } from "ui/auto-form";
import AutoForm from "ui/auto-form";

import type { Action } from "../types";
import type ActionInstances from "~/kysely/types/public/ActionInstances";
import type { CommunitiesId } from "~/kysely/types/public/Communities";
import type { StagesId } from "~/kysely/types/public/Stages";
import { updateAction } from "~/app/c/[communitySlug]/stages/manage/actions";
import { CustomServerComponentClientBoundary } from "./customServerComponentClientBoundary";

type ConfigServerComponentProps<T extends Action> =
	T extends Action<any, infer C, any> ? { action: T; config: C } : never;

export const defineActionConfigServerComponent = <T extends Action>(
	action: T,
	getFieldConfig: ({
		action,
		actionInstance,
		stageId,
		communityId,
	}: {
		action: T;
		actionInstance: ActionInstances;
		communityId: CommunitiesId;
		stageId: StagesId;
	}) => Promise<React.ReactNode>
) => {
	const serverComponent = async ({
		actionInstance,
		stageId,
		communityId,
	}: {
		actionInstance: ActionInstances;
		communityId: CommunitiesId;
		stageId: StagesId;
	}) => {
		const fieldConfig = await getFieldConfig({
			action,
			actionInstance,
			stageId,
			communityId,
		});

		const updateConfigAction = updateAction.bind(null, communityId, actionInstance.id);

		return (
			<CustomServerComponentClientBoundary
				instance={actionInstance}
				communityId={communityId}
				onUpdateAction={updateConfigAction}
				config={actionInstance.config}
				fieldConfig={fieldConfig}
				actionName={actionInstance.action}
			/>
		);
	};

	return serverComponent;
};

export type ActionConfigServerComponent<T extends Action> = ReturnType<
	typeof defineActionConfigServerComponent<T>
>;
