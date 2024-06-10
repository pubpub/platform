import type React from "react";

import type { Action } from "../types";
import type ActionInstances from "~/kysely/types/public/ActionInstances";
import type { CommunitiesId } from "~/kysely/types/public/Communities";
import type { StagesId } from "~/kysely/types/public/Stages";

export const defineActionFormFieldServerComponent = <T extends Action>(
	action: T,
	FormField: ({
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
		const F = await FormField({
			action,
			actionInstance,
			stageId,
			communityId,
		});

		return F;
	};

	return serverComponent;
};

export type ActionConfigServerComponent<T extends Action> = ReturnType<
	typeof defineActionFormFieldServerComponent<T>
>;
