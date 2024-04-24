"use client";

import type { Pub } from "@prisma/client";

import { Button } from "ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "ui/dropdown-menu";
import { ChevronDown, Play } from "ui/icon";

import type { StagePub } from "./queries";
import type { ActionInstances } from "~/kysely/types/public/ActionInstances";
import { StagePanelPubsRunActionButton } from "./StagePanelPubsRunActionButton";

export const StagePanelPubsRunActionDropDownMenu = ({
	actionInstances,
	pub,
}: {
	actionInstances: ActionInstances[];
	pub: StagePub;
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
					<DropdownMenuItem
						key={actionInstance.id}
						onSelect={(evt) => {
							// prevents the dropdown from closing when clicking on the action
							evt.preventDefault();
						}}
					>
						<StagePanelPubsRunActionButton actionInstance={actionInstance} pub={pub} />
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
