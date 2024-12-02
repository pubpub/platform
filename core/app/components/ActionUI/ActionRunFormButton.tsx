import type { ActionInstances, PubsId } from "db/public";

import { getActionByName } from "~/actions/api";
import { PathAwareDialogButton } from "../PathAwareDialogButton";
import { createActionRunFormQueryParam } from "./actionRunFormSearchParam";

export const ActionRunFormButton = ({
	actionInstance,
	pubId,
}: {
	actionInstance: ActionInstances;
	pubId: PubsId;
}) => {
	const action = getActionByName(actionInstance.action);
	const runActionFormQueryParam = createActionRunFormQueryParam({
		actionInstanceId: actionInstance.id,
		pubId,
	});

	return (
		<PathAwareDialogButton
			id={runActionFormQueryParam}
			variant="ghost"
			className="w-full justify-start"
		>
			<action.icon size="14" className="flex-shrink-0" />
			<span className="overflow-auto text-ellipsis">
				{actionInstance.name || actionInstance.action}
			</span>
		</PathAwareDialogButton>
	);
};
