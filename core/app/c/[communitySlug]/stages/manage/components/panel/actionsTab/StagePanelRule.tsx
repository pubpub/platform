"use client";

import { useCallback } from "react";

import type { Action, CommunitiesId, Event, RulesId } from "db/public";
import { Button } from "ui/button";
import { Trash } from "ui/icon";

import type { RuleForEvent } from "~/actions/_lib/rules";
import type { RuleConfig } from "~/actions/types";
import { getActionByName, humanReadableEvent } from "~/actions/api";
import { useServerAction } from "~/lib/serverActions";
import { deleteRule } from "../../../actions";

type Props = {
	communityId: CommunitiesId;
	rule: {
		id: RulesId;
		event: Event;
		instanceName: string;
		action: Action;
		config?: RuleConfig<RuleForEvent<Event>> | null;
	};
};

const actionIcon = (actionName: Action) => {
	const action = getActionByName(actionName);
	return <action.icon className="inline text-sm" />;
};

export const StagePanelRule = (props: Props) => {
	const { rule } = props;
	const runDeleteRule = useServerAction(deleteRule);
	const onDeleteClick = useCallback(async () => {
		runDeleteRule(rule.id);
	}, [rule.id, props.communityId]);

	return (
		<div className="w-full space-y-2 border px-3 py-2">
			<div className="flex w-full items-center justify-between space-x-4 text-sm">
				<div className="flex items-center gap-2 overflow-auto">
					{actionIcon(rule.action)}
					<span className="flex-grow-0 overflow-auto text-ellipsis">
						<span className="italic underline decoration-dotted">
							{rule.instanceName}
						</span>{" "}
						will run when{" "}
						<span className="italic underline decoration-dotted">
							{humanReadableEvent(rule.event, rule.config ?? undefined)}
						</span>
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
