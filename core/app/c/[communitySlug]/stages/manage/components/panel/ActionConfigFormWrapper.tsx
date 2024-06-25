import type { ActionInstances } from "db/public/ActionInstances";
import type { CommunitiesId } from "db/public/Communities";
import type { StagesId } from "db/public/Stages";
import { logger } from "logger";

import { resolveFieldConfig } from "~/actions/_lib/custom-form-field/resolveFieldConfig";
import { ActionConfigForm } from "./ActionConfigForm";

export const ActionConfigFormWrapper = async ({
	stage,
	actionInstance,
}: {
	stage: {
		id: StagesId;
		name: string;
		order: string;
		communityId: CommunitiesId;
		createdAt: Date;
		updatedAt: Date;
	};
	actionInstance: ActionInstances;
}) => {
	const resolvedFieldConfig = await resolveFieldConfig(actionInstance.action, "config", {
		stageId: stage.id,
		communityId: stage.communityId,
		actionInstance: actionInstance,
	});

	return (
		<ActionConfigForm
			instance={actionInstance}
			communityId={stage.communityId}
			actionName={actionInstance.action}
			fieldConfig={resolvedFieldConfig}
		/>
	);
};
