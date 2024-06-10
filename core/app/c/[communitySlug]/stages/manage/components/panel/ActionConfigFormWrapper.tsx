import { logger } from "logger";

import type { ActionInstances } from "~/kysely/types/public/ActionInstances";
import type { CommunitiesId } from "~/kysely/types/public/Communities";
import type { StagesId } from "~/kysely/types/public/Stages";
import { resolveFieldConfig } from "~/actions/_lib/resolveFieldConfig";
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
	logger.info("im running now");
	const resolvedFieldConfig = await resolveFieldConfig(actionInstance.action, "config", {
		stageId: stage.id,
		communityId: stage.communityId,
		actionInstanceId: actionInstance.id,
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
