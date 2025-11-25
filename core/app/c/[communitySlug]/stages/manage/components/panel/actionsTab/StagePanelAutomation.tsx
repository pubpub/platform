"use client";

import { Copy, Pencil, Trash2 } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useCallback } from "react";

import type { CommunitiesId, StagesId } from "db/public";
import { DynamicIcon, type IconConfig } from "ui/dynamic-icon";
import { Item, ItemActions, ItemContent, ItemMedia, ItemTitle } from "ui/item";
import { toast } from "ui/use-toast";

import type { FullAutomation } from "db/types";
import { getTriggerByName } from "~/actions/_lib/triggers";
import { EllipsisMenu, EllipsisMenuButton } from "~/app/components/EllipsisMenu";
import { didSucceed, useServerAction } from "~/lib/serverActions";
import { deleteAutomation, duplicateAutomation } from "../../../actions";

type Props = {
	stageId: StagesId;
	communityId: CommunitiesId;
	automation: FullAutomation;
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

	const runDeleteAutomation = useServerAction(deleteAutomation);
	const onDeleteClick = useCallback(async () => {
		const res = await runDeleteAutomation(automation.id, props.stageId);
		if (didSucceed(res)) {
			toast({
				title: "Automation deleted successfully",
			});
		}
	}, [props.stageId, runDeleteAutomation, automation.id]);

	const runDuplicateAutomation = useServerAction(duplicateAutomation);
	const onDuplicateClick = useCallback(async () => {
		const res = await runDuplicateAutomation(automation.id, props.stageId);
		if (didSucceed(res)) {
			toast({
				title: "Automation duplicated successfully",
			});
		}
	}, [props.stageId, runDuplicateAutomation, automation.id]);

	const triggerIcons = automation.triggers.map((trigger) => getTriggerByName(trigger.event));

	return (
		<Item variant="outline" size="sm">
			<ItemMedia>
				<DynamicIcon icon={automation.icon as IconConfig} size={16} />
			</ItemMedia>
			<ItemContent className="w-full flex-row items-center justify-between">
				<ItemTitle>{automation.name}</ItemTitle>
				<div className="flex items-center gap-2 rounded-full border bg-gray-50 p-2">
					{triggerIcons.map((icon) => (
						<icon.display.icon key={icon.event} className="h-3 w-3 text-xs" />
					))}
				</div>
			</ItemContent>

			<ItemActions>
				<EllipsisMenu>
					<EllipsisMenuButton onClick={onEditClick}>
						<Pencil size={14} /> Edit
					</EllipsisMenuButton>
					<EllipsisMenuButton onClick={onDuplicateClick}>
						<Copy size={14} /> Duplicate
					</EllipsisMenuButton>
					<EllipsisMenuButton onClick={onDeleteClick} className="text-destructive">
						<Trash2 size={14} /> Delete
					</EllipsisMenuButton>
				</EllipsisMenu>
			</ItemActions>
		</Item>
	);
};
