import type { StagePub } from "./queries";
import type { ActionInstances } from "~/kysely/types/public/ActionInstances";
import type { Stages } from "~/kysely/types/public/Stages";
import { resolveFieldConfig } from "~/actions/_lib/resolveFieldConfig";
import { ActionRunForm } from "./ActionRunForm";

export const ActionRunFormContextWrapper = async ({
	actionInstance,
	pub,
	stage,
}: {
	actionInstance: ActionInstances;
	pub: StagePub;
	stage: Stages;
}) => {
	const resolvedFieldConfig = await resolveFieldConfig(actionInstance.action, "params", {
		pubId: pub.id,
		stageId: stage.id,
		communityId: pub.communityId,
		actionInstanceId: actionInstance.id,
	});

	return (
		<ActionRunForm
			actionInstance={actionInstance}
			pub={pub}
			fieldConfig={resolvedFieldConfig}
		/>
	);
};
