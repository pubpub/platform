"use client";

import { useCallback } from "react";
import { parseAsString, useQueryState } from "nuqs";

import type {
	Action,
	ActionInstances,
	ActionInstancesId,
	CommunitiesId,
	Event,
	RulesId,
	StagesId,
} from "db/public";
import { Button } from "ui/button";
import { Pencil } from "ui/icon";
import { cn } from "utils";

import type { RuleForEvent } from "~/actions/_lib/rules";
import type { RuleConfig } from "~/actions/types";
import { getActionByName, getRuleByName, humanReadableEventHydrated } from "~/actions/api";
import { useCommunity } from "~/app/components/providers/CommunityProvider";

type Props = {
	stageId: StagesId;
	communityId: CommunitiesId;
	rule: {
		id: RulesId;
		event: Event;
		actionInstance: ActionInstances;
		sourceActionInstance?: ActionInstances | null;
		config: RuleConfig<RuleForEvent<Event>> | null;
		createdAt: Date;
		updatedAt: Date;
		actionInstanceId: ActionInstancesId;
		sourceActionInstanceId: ActionInstancesId | null;
	};
};

const ActionIcon = (props: { actionName: Action; className?: string }) => {
	const action = getActionByName(props.actionName);
	return <action.icon className={cn("inline text-sm", props.className)} />;
};

export const StagePanelRule = (props: Props) => {
	const { rule } = props;

	const [, setEditingRuleId] = useQueryState("rule-id", parseAsString.withDefault("new-rule"));

	const onEditClick = useCallback(() => {
		setEditingRuleId(rule.id);
	}, [rule.id, setEditingRuleId]);
	const community = useCommunity();
	const ruleSettings = getRuleByName(rule.event);

	return (
		<div className="w-full space-y-2 border px-3 py-2">
			<div className="flex w-full items-center justify-between space-x-4 text-sm">
				<div className="flex items-center gap-2 overflow-auto">
					<span className="flex-grow-0 overflow-auto text-ellipsis">
						When{" "}
						<span className="italic underline decoration-dotted">
							{<ruleSettings.display.icon className="mr-1 inline h-4 w-4 text-xs" />}
							{rule.sourceActionInstance ? (
								<>
									<ActionIcon
										actionName={rule.sourceActionInstance.action}
										className="mr-1 inline h-4 w-4 text-xs"
									/>
									{humanReadableEventHydrated(rule.event, community, {
										rule,
										config: rule.config?.ruleConfig ?? undefined,
										sourceAction: rule.sourceActionInstance,
									})}
								</>
							) : (
								humanReadableEventHydrated(rule.event, community, {
									rule,
									config: rule.config?.ruleConfig ?? undefined,
									sourceAction: rule.sourceActionInstance,
								})
							)}
						</span>
						<br /> run{" "}
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
					<Button variant="ghost" size="sm" className="flex gap-2" onClick={onEditClick}>
						<Pencil size={14} />
					</Button>
				</div>
			</div>
		</div>
	);
};
