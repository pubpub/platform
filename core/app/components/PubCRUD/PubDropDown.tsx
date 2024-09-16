import type { PubsId } from "db/public";
import { Button } from "ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "ui/dropdown-menu";
import { MoreVertical } from "ui/icon";

import { PubIOButton } from "./PubIOButton";

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
					<PubIOButton
						button={{
							variant: "ghost",
							title: "Edit Pub",
							className: "w-full justify-start",
						}}
						pubId={pubId}
						searchParams={{}}
						mode="update"
					/>
				</DropdownMenuItem>
				<DropdownMenuItem asChild>
					<PubIOButton
						button={{
							variant: "ghost",
							title: "Remove Pub",
							className: "w-full justify-start",
						}}
						pubId={pubId}
						searchParams={{}}
						mode="remove"
					/>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
