import {
	getCustomConfigComponentByActionName,
	getCustomFormContextByActionName,
} from "~/actions/_lib/getCustomConfigComponent";
import { ActionInstances } from "~/kysely/types/public/ActionInstances";
import { CommunitiesId } from "~/kysely/types/public/Communities";
import Stages, { StagesId } from "~/kysely/types/public/Stages";
import { ActionConfigForm } from "./ActionConfigForm";
import { StagePanelActionEditor } from "./StagePanelActionEditor";

export const ActionConfigFormContextWrapper = async ({
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
	const Context = await getCustomFormContextByActionName(actionInstance.action, "config");

	return (
		// <StagePanelActionEditor
		// 	key={actionInstance.id}
		// 	actionInstance={actionInstance}
		// 	onDelete={onDeleteAction}
		// 	communityId={stage.communityId}
		// 	actionConfig={
		<Context actionInstance={actionInstance} communityId={stage.communityId} stageId={stage.id}>
			<ActionConfigForm
				instance={actionInstance}
				communityId={stage.communityId}
				actionName={actionInstance.action}
			/>
		</Context>
		// 	}
		// />
	);
};
