import { Button } from "ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "ui/dropdown-menu";
import { MoreVertical } from "ui/icon";

import type { PubsId } from "~/kysely/types/public/Pubs";
import { PubRemoveButton } from "./PubRemoveButton";
import { PubUpdateButton } from "./PubUpdateButton";

export const PubDropDown = ({ pubId }: { pubId: PubsId }) => {
	//
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="sm">
					<MoreVertical size="12" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="width">
				<DropdownMenuItem asChild>
					<PubUpdateButton
						button={{
							variant: "ghost",
							title: "Edit Pub",
							className: "w-full justify-start",
						}}
						pubId={pubId}
					/>
				</DropdownMenuItem>
				<DropdownMenuItem asChild>
					<PubRemoveButton
						button={{
							variant: "ghost",
							title: "Remove Pub",
							className: "w-full justify-start",
						}}
						pubId={pubId}
					/>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
