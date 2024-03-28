"use client";

import { useCallback, useState } from "react";
import { Button } from "ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "ui/collapsible";
import { ChevronDown } from "ui/icon";
import { Separator } from "ui/separator";
import { getActionByName } from "~/actions";
import { StagePayloadActionInstance } from "~/lib/types";
import { StagePanelActionConfig } from "./StagePanelActionConfig";
import { logger } from "logger";

type Props = {
	actionInstance: StagePayloadActionInstance;
	onDelete: (actionInstanceId: string) => void;
};

export const StagePanelActionEditor = (props: Props) => {
	const [isOpen, setIsOpen] = useState(false);
	const onDeleteClick = useCallback(() => {
		props.onDelete(props.actionInstance.id);
	}, [props.onDelete, props.actionInstance]);
	const action = getActionByName(props.actionInstance.action.name);

	if (!action) {
		logger.warn(`Invalid action name ${props.actionInstance.action.name}`);
		return null;
	}

	return (
		<Collapsible
			open={isOpen}
			onOpenChange={setIsOpen}
			className="w-full space-y-2 border px-3 py-2"
		>
			<div className="flex items-center justify-between space-x-4 text-sm w-full">
				<span>{props.actionInstance.action.name}</span>
				<div className="flex gap-1">
					<CollapsibleTrigger asChild>
						<Button variant="ghost" size="sm">
							<ChevronDown size={18} />
						</Button>
					</CollapsibleTrigger>
				</div>
			</div>
			<CollapsibleContent className="space-y-2 text-sm">
				<Separator />
				<div className="py-2 flex flex-col gap-2">
					<StagePanelActionConfig action={action} />
					<div className="flex justify-end">
						<Button variant="secondary" size="sm" onClick={onDeleteClick}>
							Remove
						</Button>
					</div>
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
};
