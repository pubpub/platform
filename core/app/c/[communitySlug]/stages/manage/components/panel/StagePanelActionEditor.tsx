"use client";

import { logger } from "logger";
import { useCallback, useState } from "react";

import { logger } from "logger";
import { Button } from "ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "ui/collapsible";
import { ChevronDown } from "ui/icon";
import { Separator } from "ui/separator";

import { getActionByName } from "~/actions";
import { ClientException } from "~/lib/error/ClientException";
import { useShowClientException } from "~/lib/error/useShowClientException";
import { StagePayloadActionInstance } from "~/lib/types";
import { StagePanelActionConfig } from "./StagePanelActionConfig";

type Props = {
	actionInstance: StagePayloadActionInstance;
	onDelete: (actionInstanceId: string) => Promise<ClientException>;
};

export const StagePanelActionEditor = (props: Props) => {
	const showClientException = useShowClientException();
	const [isOpen, setIsOpen] = useState(false);
	const onDeleteClick = useCallback(async () => {
		const result = await props.onDelete(props.actionInstance.id);
		if (result) {
			showClientException(result);
		}
	}, [props.onDelete, props.actionInstance, showClientException]);
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
			<div className="flex w-full items-center justify-between space-x-4 text-sm">
				<span>{props.actionInstance.action.name}</span>
				<div className="flex gap-1">
					<CollapsibleTrigger asChild>
						<Button variant="ghost" size="sm">
							<ChevronDown size={18} />
						</Button>
					</CollapsibleTrigger>
				</div>
			</div>
			<CollapsibleContent className="space-y-4 text-sm">
				<Separator />
				<p>{action.description}</p>
				<div className="flex flex-col gap-2 py-2">
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
