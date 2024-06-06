import { getCustomFormContextByActionName } from "~/actions/_lib/getCustomConfigComponent";
import { ActionInstances } from "~/kysely/types/public/ActionInstances";
import { Stages } from "~/kysely/types/public/Stages";
import { ActionConfigForm } from "./ActionConfigForm";
import { StagePub } from "./queries";

export const ActionRunFormContextWrapper = async ({
	actionInstance,
	pub,
	stage,
}: {
	actionInstance: ActionInstances;
	pub: StagePub;
	stage: Stages;
}) => {
	const Context = await getCustomFormContextByActionName(actionInstance.action, "config");

	return (
		<Context
			actionInstance={actionInstance}
			communityId={stage.communityId}
			stageId={stage.id}
			pubId={pub.id}
		>
			<ActionConfigForm
				actionName={actionInstance.action}
				instance={actionInstance}
				communityId={stage.communityId}
			/>
		</Context>
	);
};
