"use client";

import { useCallback, useEffect, useState } from "react";
import { useSSE } from "use-next-sse";

import type { ActionInstances, ActionInstancesId, ActionRunStatus, StagesId } from "db/public";
import { logger } from "logger";
import { Button } from "ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "ui/collapsible";
import { ChevronUp, Pencil, Trash } from "ui/icon";
import { Input } from "ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import { toast } from "ui/use-toast";
import { cn } from "utils";

import type { ActionRunNotification } from "~/app/api/v0/c/[communitySlug]/sse/route";
import type { ActionRunUpdate } from "~/app/c/[communitySlug]/Notifier";
import { getActionByName } from "~/actions/api";
import { useActionInstanceUpdates } from "~/app/c/[communitySlug]/Notifier";
import { useServerAction } from "~/lib/serverActions";
import * as actions from "../../../actions";

type Props = {
	actionInstance: ActionInstances;
	onDelete: (actionInstanceId: ActionInstancesId, stageId: StagesId) => Promise<unknown>;
	communityId: string;
	children: React.ReactNode;
	stageId: StagesId;
};

export const UpdateCircle = ({ status, timestamp, result, pubId }: ActionRunUpdate) => {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div
					className={cn("h-2 w-2 rounded-full transition-colors duration-200", {
						"bg-green-500": status === "success",
						"bg-red-500": status === "failure",
						"bg-yellow-500": status === "scheduled",
						"bg-gray-500":
							status !== "success" && status !== "failure" && status !== "scheduled",
					})}
				/>
			</TooltipTrigger>
			<TooltipContent className="max-w-xs p-3">
				<div className="space-y-2">
					<div className="flex items-center gap-2">
						<div
							className={cn("h-3 w-3 rounded-full", {
								"bg-green-500": status === "success",
								"bg-red-500": status === "failure",
								"bg-yellow-500": status === "scheduled",
								"bg-gray-500":
									status !== "success" &&
									status !== "failure" &&
									status !== "scheduled",
							})}
						/>
						<span className="font-medium capitalize">{status}</span>
					</div>

					<div className="text-xs text-gray-600">
						{timestamp && (
							<div className="flex items-center justify-between">
								<span>Timestamp:</span>
								<span className="font-mono">{timestamp}</span>
							</div>
						)}

						{pubId && (
							<div className="flex items-center justify-between">
								<span>ID:</span>
								<span className="truncate font-mono">{pubId}</span>
							</div>
						)}
					</div>

					{result && (
						<div className="pt-1">
							<div className="text-xs font-medium">Result:</div>
							<pre className="mt-1 max-h-40 overflow-auto rounded bg-gray-100 p-2 font-mono text-xs">
								{JSON.stringify(result, null, 2)}
							</pre>
						</div>
					)}
				</div>
			</TooltipContent>
		</Tooltip>
	);
};

export const StagePanelActionEditor = (props: Props) => {
	const runOnDelete = useServerAction(props.onDelete);
	const [isOpen, setIsOpen] = useState(false);
	const onDeleteClick = useCallback(async () => {
		runOnDelete(props.actionInstance.id, props.stageId);
	}, [props.actionInstance, runOnDelete]);
	const action = getActionByName(props.actionInstance.action);

	const [updates, setUpdates] = useState<ActionRunUpdate[]>([]);
	const { data, error } = useSSE<ActionRunUpdate>({
		url: `/api/v0/c/${props.communityId}/sse`,
		eventName: "action_run_update",
		withCredentials: true,
	});

	useEffect(() => {
		if (error) {
			toast({
				variant: "destructive",
				title: "Error fetching action run updates",
				description: error.message,
			});
		}
		if (data) {
			if (data.actionInstanceId === props.actionInstance.id) {
				setUpdates((old) => [data, ...old]);
			}
		}
	}, [data, error]);
	const lastUpdate = updates[0];

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
					{lastUpdate && (
						<>
							<UpdateCircle {...lastUpdate} />
						</>
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
