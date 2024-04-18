"use client";

import { useCallback } from "react";

import { Button } from "ui/button";
import { Trash } from "ui/icon";

import type Action from "~/kysely/types/public/Action";
import type { CommunitiesId } from "~/kysely/types/public/Communities";
import type Event from "~/kysely/types/public/Event";
import type { RulesId } from "~/kysely/types/public/Rules";
import { getActionByName, humanReadableEvent } from "~/actions/api";
import { useServerAction } from "~/lib/serverActions";
import { deleteRule } from "../../actions";

type Props = {
	communityId: CommunitiesId;
	rule: {
		id: RulesId;
		event: Event;
		instanceName: string;
		action: Action;
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
		runDeleteRule(rule.id, props.communityId);
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
							{humanReadableEvent(rule.event)}
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
