import type { PubsId, StagesId } from "db/public";
import { Button } from "ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "ui/dropdown-menu";
import { MoreVertical } from "ui/icon";

import { PubCRUDButton } from "./PubCRUDButton";

export const PubDropDown = ({ pubId }: { pubId: PubsId }) => {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="sm" data-testid="pub-dropdown-button">
					<MoreVertical size="12" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="width">
				<DropdownMenuItem asChild>
					<PubCRUDButton
						button={{
							variant: "ghost",
							title: "Edit Pub",
							className: "w-full justify-start",
						}}
						identifyingString={pubId}
						method="update"
					/>
				</DropdownMenuItem>
				<DropdownMenuItem asChild>
					<PubCRUDButton
						identifyingString={pubId}
						method="remove"
						button={{
							variant: "ghost",
							title: "Remove Pub",
							className: "w-full justify-start",
						}}
					/>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
