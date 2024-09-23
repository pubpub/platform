"use client";

import type { ActionInstances, PubsId } from "db/public";
import { Button } from "ui/button";

import { getActionByName } from "~/actions/api";
import { useSearchParamModal } from "~/lib/client/useSearchParamModal";
import { createActionRunFormQueryParam } from "./actionRunFormQueryParam";

export const ActionRunFormButton = ({
	actionInstance,
	pubId,
}: {
	actionInstance: ActionInstances;
	pubId: PubsId;
}) => {
	const action = getActionByName(actionInstance.action);
	const runActionFormQueryParam = createActionRunFormQueryParam(actionInstance.id, pubId);

	const { toggleModal } = useSearchParamModal({ identifyingString: runActionFormQueryParam });
	return (
		<Button
			onClick={() => toggleModal(true)}
			variant="ghost"
			className="flex w-full items-center justify-start gap-x-4 px-4 py-2"
		>
			<action.icon size="14" className="flex-shrink-0" />
			<span className="overflow-auto text-ellipsis">
				{actionInstance.name || actionInstance.action}
			</span>
		</Button>
	);
};
