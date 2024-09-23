import "server-only";

import type { ActionInstances, PubsId } from "db/public";
import { Button } from "ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "ui/dropdown-menu";
import { ChevronDown, Play } from "ui/icon";

import { ActionRunFormButton } from "./ActionRunFormButton";

export type PageContext = {
	params: Record<string, unknown>;
	searchParams: Record<string, unknown>;
};

export const PubsRunActionDropDownMenu = ({
	actionInstances,
	pubId,
}: {
	actionInstances: ActionInstances[];
	pubId: PubsId;
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
					<ActionRunFormButton
						key={actionInstance.id}
						actionInstance={actionInstance}
						pubId={pubId}
					/>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
