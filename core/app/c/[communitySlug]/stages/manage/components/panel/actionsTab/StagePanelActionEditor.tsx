"use client";

import { useCallback, useEffect, useState } from "react";
import { isAfter, parseISO } from "date-fns";

import type { ActionInstances, ActionInstancesId, ActionRuns, StagesId } from "db/public";
import { logger } from "logger";
import { Button } from "ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "ui/collapsible";
import { ChevronUp, Pencil, Trash } from "ui/icon";
import { Input } from "ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import { cn } from "utils";

import { getActionByName } from "~/actions/api";
import { useServerAction } from "~/lib/serverActions";
import * as actions from "../../../actions";

type Props = {
	actionInstance: ActionInstances & { lastActionRun: ActionRuns | null };
	onDelete: (actionInstanceId: ActionInstancesId, stageId: StagesId) => Promise<unknown>;
	communityId: string;
	children: React.ReactNode;
	stageId: StagesId;
};

export const UpdateCircle = (
	props: ActionRuns & {
		stale: boolean;
		setStale: (stale: boolean) => void;
		setInitTime: (initTime: Date) => void;
	}
) => {
	return (
		<Tooltip>
			<TooltipTrigger
				onMouseOver={() => {
					if (props.stale === true) {
						props.setStale(false);
						props.setInitTime(new Date());
					}
				}}
				asChild
			>
				<div
					data-testid={`action-instance-${props.actionInstanceId}-update-circle`}
					data-status={props.status}
					className={cn(
						"relative m-1 h-3 w-3 rounded-full transition-colors duration-200",
						{
							"bg-green-500": props.status === "success",
							"bg-red-500": props.status === "failure",
							"bg-yellow-500": props.status === "scheduled",
							"bg-gray-500":
								props.status !== "success" &&
								props.status !== "failure" &&
								props.status !== "scheduled",
						}
					)}
				>
					{props.stale && (
						<span
							data-testid={`action-instance-${props.actionInstanceId}-update-circle-stale`}
							className="absolute -top-0.5 right-0 block h-1.5 w-1.5 animate-pulse rounded-full bg-blue-800"
						></span>
					)}
				</div>
			</TooltipTrigger>
			<TooltipContent className="max-w-xs p-3">
				<div className="space-y-2">
					<div className="flex items-center gap-2">
						<div
							className={cn("h-3 w-3 rounded-full", {
								"bg-green-500": props.status === "success",
								"bg-red-500": props.status === "failure",
								"bg-yellow-500": props.status === "scheduled",
								"bg-gray-500":
									props.status !== "success" &&
									props.status !== "failure" &&
									props.status !== "scheduled",
							})}
						/>
						<span className="font-medium capitalize">{props.status}</span>
					</div>

					<div className="text-xs text-gray-600">
						{props.createdAt && (
							<div className="flex items-center justify-between">
								<span>Timestamp: </span>
								<span
									className="font-mono"
									data-testid={`action-instance-${props.actionInstanceId}-update-circle-timestamp`}
								>
									{props.createdAt.toLocaleString()}
								</span>
							</div>
						)}

						{props.pubId && (
							<div className="flex items-center justify-between">
								<span>ID:</span>
								<span className="truncate font-mono">{props.pubId}</span>
							</div>
						)}
					</div>

					{Boolean(props.result) && (
						<div className="pt-1">
							<div className="text-xs font-medium">Result:</div>
							<pre
								className="mt-1 max-h-40 overflow-auto rounded bg-gray-100 p-2 font-mono text-xs"
								data-testid={`action-instance-${props.actionInstanceId}-update-circle-result`}
							>
								{JSON.stringify(props.result, null, 2)}
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

	const [initTime, setInitTime] = useState(new Date());
	const [isStale, setIsStale] = useState(false);

	useEffect(() => {
		if (!props.actionInstance.lastActionRun) return;

		// parse both as UTC to ensure proper comparison regardless of local timezone
		const lastRunTime = parseISO(`${props.actionInstance.lastActionRun.createdAt.toString()}Z`);

		// compare the dates using date-fns isAfter helper
		if (isAfter(lastRunTime, initTime)) {
			setIsStale(true);
		}
	}, [props.actionInstance.lastActionRun]);

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
					{props.actionInstance.lastActionRun && (
						<>
							<UpdateCircle
								{...props.actionInstance.lastActionRun}
								stale={isStale}
								setStale={setIsStale}
								setInitTime={setInitTime}
							/>
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
