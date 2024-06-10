import {
	getCustomConfigComponentByActionName,
	getCustomFormContextByActionName,
} from "~/actions/_lib/getCustomConfigComponent";
import { getActionByName } from "~/actions/api";
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

	const action = getActionByName(actionInstance.action);
	const fieldConfig = action.config.fieldConfig;

	if (fieldConfig && "outputMap" in fieldConfig) {
		const path = fieldConfig.outputMap.fieldType;
		const full = `~/actions/http/config-component`;

		// console.log({ path, full: `~/actions/${action.name}/config-component.tsx` });
		const RenderedOutputMap = await getCustomConfigComponentByActionName(
			action.name,
			"config",
			"outputMap"
		);
		// .then(
		// 	(m) => m.default
		// );

		fieldConfig.outputMap.fieldType = (
			<RenderedOutputMap
				action={action}
				actionInstance={actionInstance}
				stageId={stage.id}
				communityId={stage.communityId}
			/>
		);
		// );
	}

	return (
		// <StagePanelActionEditor
		// 	key={actionInstance.id}
		// 	actionInstance={actionInstance}
		// 	onDelete={onDeleteAction}
		// 	communityId={stage.communityId}
		// 	actionConfig={
		<Context actionInstance={actionInstance} communityId={stage.communityId} stageId={stage.id}>
			{/* {fieldConfig?.outputMap?.fieldType} */}
			<ActionConfigForm
				instance={actionInstance}
				communityId={stage.communityId}
				actionName={actionInstance.action}
				fieldConfig={fieldConfig}
			/>
		</Context>
		// 	}
		// />
	);
};
