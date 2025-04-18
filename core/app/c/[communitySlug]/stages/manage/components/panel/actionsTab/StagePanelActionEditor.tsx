"use client";

import { useCallback, useState } from "react";

import type { ActionInstances, ActionInstancesId, StagesId } from "db/public";
import { logger } from "logger";
import { Button } from "ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "ui/collapsible";
import { ChevronUp, Pencil, Trash } from "ui/icon";
import { Input } from "ui/input";

import { getActionByName } from "~/actions/api";
import { useServerAction } from "~/lib/serverActions";
import * as actions from "../../../actions";

type Props = {
	actionInstance: ActionInstances;
	onDelete: (actionInstanceId: ActionInstancesId, stageId: StagesId) => Promise<unknown>;
	communityId: string;
	children: React.ReactNode;
	stageId: StagesId;
};

export const StagePanelActionEditor = (props: Props) => {
	const runOnDelete = useServerAction(props.onDelete);
	const [isOpen, setIsOpen] = useState(false);
	const onDeleteClick = useCallback(async () => {
		runOnDelete(props.actionInstance.id, props.stageId);
	}, [props.actionInstance, runOnDelete]);
	const action = getActionByName(props.actionInstance.action);

	if (!action) {
		logger.warn(`Invalid action name ${props.actionInstance.action}`);
		return null;
	}

	return (
		<Collapsible
			open={isOpen}
			onOpenChange={setIsOpen}
			className="w-full"
			data-testid={`action-instance-${props.actionInstance.name}`}
		>
			<div className="flex w-full items-center justify-between space-x-4 border-b bg-gray-100 px-3 py-2 text-sm">
				<div className="flex items-center gap-2 overflow-auto">
					<action.icon size="14" className="flex-shrink-0" />
					{isOpen ? (
						<Input
							aria-label="Edit action name"
							className="flex-grow-1 ml-1 h-8 p-0 pl-1"
							defaultValue={props.actionInstance.name || action.name}
							onBlur={async (evt) => {
								await actions.updateAction(
									props.actionInstance.id as ActionInstancesId,
									props.stageId,
									{
										name: evt.target.value?.trim(),
									}
								);
							}}
						/>
					) : (
						<span className="ml-2 flex-grow-0 overflow-auto text-ellipsis">
							{props.actionInstance.name || action.name}
						</span>
					)}
				</div>
				<div className="flex gap-1">
					<CollapsibleTrigger asChild>
						<Button variant="ghost" size="sm" aria-label="Edit action">
							{isOpen ? <ChevronUp size={16} /> : <Pencil size={16} />}
						</Button>
					</CollapsibleTrigger>
				</div>
			</div>
			<CollapsibleContent className="space-y-4 bg-gray-50 px-3 py-2 text-sm">
				<p>{action.description}</p>
				<div className="flex flex-col gap-2 py-2">
					{props.children}
					<div className="flex justify-end">
						<Button
							variant="secondary"
							size="sm"
							className="flex gap-2"
							onClick={onDeleteClick}
						>
							<Trash size={14} />
							Remove
						</Button>
					</div>
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
};
