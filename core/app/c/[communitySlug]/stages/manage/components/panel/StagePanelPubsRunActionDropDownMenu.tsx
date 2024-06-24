import type { ActionInstances } from "db/public/ActionInstances";
import type { Stages } from "db/public/Stages";

import React from "react";

import { Button } from "ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "ui/dropdown-menu";
import { ChevronDown, Play } from "ui/icon";

import type { StagePub } from "./queries";
import { ActionRunFormWrapper } from "./ActionRunFormWrapper";
import { StagePanelPubsRunActionDropDownMenuItem } from "./StagePanelPubsRunActionDropDownMenuItem";

export const StagePanelPubsRunActionDropDownMenu = ({
	actionInstances,
	pub,
	stage,
}: {
	actionInstances: ActionInstances[];
	pub: StagePub;
	stage: Stages;
}) => {
	if (!actionInstances.length) {
		return null;
	}

	return (
		<DropdownMenu modal={true}>
			<DropdownMenuTrigger asChild>
				<Button className="flex items-center gap-x-2" variant="outline" size="sm">
					<Play size="12" />
					Run action
					<ChevronDown size="14" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				{actionInstances.map((actionInstance) => (
					<StagePanelPubsRunActionDropDownMenuItem key={actionInstance.id}>
						<ActionRunFormWrapper
							stage={stage}
							pub={pub}
							actionInstance={actionInstance}
						/>
					</StagePanelPubsRunActionDropDownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
