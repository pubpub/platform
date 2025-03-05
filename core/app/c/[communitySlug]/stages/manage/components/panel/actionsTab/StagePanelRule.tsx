"use client";

import { useCallback } from "react";

import type { Action, ActionInstances, CommunitiesId, Event, RulesId, StagesId } from "db/public";
import { Button } from "ui/button";
import { Trash } from "ui/icon";
import { cn } from "utils";

import type { RuleForEvent } from "~/actions/_lib/rules";
import type { RuleConfig } from "~/actions/types";
import { getActionByName, humanReadableEvent } from "~/actions/api";
import { useServerAction } from "~/lib/serverActions";
import { deleteRule } from "../../../actions";

type Props = {
	stageId: StagesId;
	communityId: CommunitiesId;
	rule: {
		id: RulesId;
		event: Event;
		actionInstance: ActionInstances;
		watchedActionInstance?: ActionInstances | null;
		config?: RuleConfig<RuleForEvent<Event>> | null;
	};
};

const ActionIcon = (props: { actionName: Action; className?: string }) => {
	const action = getActionByName(props.actionName);
	return <action.icon className={cn("inline text-sm", props.className)} />;
};

export const StagePanelRule = (props: Props) => {
	const { rule } = props;
	const runDeleteRule = useServerAction(deleteRule);
	const onDeleteClick = useCallback(async () => {
		runDeleteRule(rule.id, props.stageId);
	}, [rule.id, props.communityId]);

	return (
		<div className="w-full space-y-2 border px-3 py-2">
			<div className="flex w-full items-center justify-between space-x-4 text-sm">
				<div className="flex items-center gap-2 overflow-auto">
					<span className="flex-grow-0 overflow-auto text-ellipsis">
						If{" "}
						<span className="italic underline decoration-dotted">
							{rule.watchedActionInstance ? (
								<>
									<ActionIcon
										actionName={rule.watchedActionInstance.action}
										className="mr-1 h-4 w-4 text-xs"
									/>
									{humanReadableEvent(
										rule.event,
										rule.config ?? undefined,
										rule.watchedActionInstance
									)}
								</>
							) : (
								humanReadableEvent(rule.event, rule.config ?? undefined)
							)}
						</span>
						, run{" "}
						<span className="italic underline decoration-dotted">
							<ActionIcon
								actionName={rule.actionInstance.action}
								className="mx-1 h-4 w-4 text-xs"
							/>
							{rule.actionInstance.name}
						</span>{" "}
					</span>
				</div>
				<div className="flex-gap-1">
					<Button
						variant="secondary"
						size="sm"
						className="flex gap-2"
						onClick={onDeleteClick}
					>
						<Trash size={14} />
					</Button>
				</div>
			</div>
		</div>
	);
};
