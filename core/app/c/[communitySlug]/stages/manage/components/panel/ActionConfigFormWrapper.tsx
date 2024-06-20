import type { ActionInstances } from "~/kysely/types/public/ActionInstances";
import type { CommunitiesId } from "~/kysely/types/public/Communities";
import type { StagesId } from "~/kysely/types/public/Stages";
import { resolveFieldConfig } from "~/actions/_lib/custom-form-field/resolveFieldConfig";
import { ActionConfigForm } from "./ActionConfigForm";
import { PageContext } from "./StagePanelPubsRunActionDropDownMenu";

export const ActionConfigFormWrapper = async ({
	stage,
	actionInstance,
	pageContext,
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
	pageContext: PageContext;
}) => {
	const resolvedFieldConfig = await resolveFieldConfig(actionInstance.action, "config", {
		stageId: stage.id,
		communityId: stage.communityId,
		actionInstance,
		pageContext,
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
