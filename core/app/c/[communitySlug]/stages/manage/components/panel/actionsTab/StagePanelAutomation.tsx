"use client";

import { useCallback } from "react";
import { parseAsString, useQueryState } from "nuqs";

import type { CommunitiesId, StagesId } from "db/public";
import { Button } from "ui/button";
import { DynamicIcon, Pencil } from "ui/icon";

import type { getAutomation } from "~/lib/db/queries";
import type { AutoReturnType } from "~/lib/types";
import { getTriggerByName } from "~/actions/_lib/triggers";

type Props = {
	stageId: StagesId;
	communityId: CommunitiesId;
	automation: AutoReturnType<typeof getAutomation>["executeTakeFirstOrThrow"];
};

export const StagePanelAutomation = (props: Props) => {
	const { automation } = props;

	const [, setEditingAutomationId] = useQueryState(
		"automation-id",
		parseAsString.withDefault("new-automation")
	);

	const onEditClick = useCallback(() => {
		setEditingAutomationId(automation.id);
	}, [automation.id, setEditingAutomationId]);
	const triggerIcons = automation.triggers.map((trigger) => getTriggerByName(trigger.event));

	return (
		<div className="w-full space-y-2 border px-3 py-2">
			<div className="flex w-full items-center justify-between space-x-4 text-sm">
				<div className="flex items-center gap-2 overflow-auto">
					<DynamicIcon icon={automation.icon} size={16} />
					{/* When{" "} */}
					<span className="italic underline decoration-dotted">
						{/* {
								<automationSettings.display.icon className="mr-1 inline h-4 w-4 text-xs" />
							} */}
						{automation.name}
					</span>

					{/* <br /> run{" "}
						<span className="italic underline decoration-dotted">
							<ActionIcon
								actionName={automation.actionInstance.action}
								className="mx-1 h-4 w-4 text-xs"
							/>
							{automation.actionInstance.name}
						</span>{" "} */}
				</div>
				<div className="flex gap-1 p-1">
					<div className="flex items-center gap-2 rounded-full border bg-gray-50 p-0.5 px-2">
						{triggerIcons.map((icon) => (
							<icon.display.icon key={icon.event} className="h-3 w-3 text-xs" />
						))}
					</div>
					<Button variant="ghost" size="sm" className="flex gap-2" onClick={onEditClick}>
						<Pencil size={14} />
					</Button>
				</div>
			</div>
		</div>
	);
};
