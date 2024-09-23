import "server-only";

import type { ActionInstances, PubsId, Stages } from "db/public";
import { Button } from "ui/button";
import { DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "ui/dialog";

import type { PageContext } from "./PubsRunActionDropDownMenu";
import { getActionByName } from "~/actions/api";
import { SearchParamModal } from "~/lib/client/SearchParamModal";
import { isModalOpen } from "~/lib/server/modal";
import { ActionRunFormWrapper } from "./ActionRunFormWrapper";

export const ActionRunModal = ({
	actionInstance,
	pubId,
	stage,
	pageContext,
}: {
	actionInstance: ActionInstances;
	pubId: PubsId;
	stage: Stages;
	pageContext: PageContext;
}) => {
	const identifyingString = `action-run-form-${actionInstance.id}-${pubId}` as const;

	const isOpen = isModalOpen(identifyingString);
	const action = getActionByName(actionInstance.action);

	return (
		<SearchParamModal identifyingString={identifyingString}>
			<DialogTrigger asChild>
				<Button
					variant="ghost"
					className="flex w-full items-center justify-start gap-x-4 px-4 py-2"
				>
					<action.icon size="14" className="flex-shrink-0" />
					<span className="overflow-auto text-ellipsis">
						{actionInstance.name || actionInstance.action}
					</span>
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-full overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{actionInstance.name || actionInstance.action}</DialogTitle>
				</DialogHeader>

				{isOpen && (
					<ActionRunFormWrapper
						actionInstance={actionInstance}
						pubId={pubId}
						stage={stage}
						pageContext={pageContext}
					/>
				)}
			</DialogContent>
		</SearchParamModal>
	);
};
