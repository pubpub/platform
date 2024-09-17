import { Suspense } from "react";

import type { PubsId } from "db/public";
import { Button } from "ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "ui/dropdown-menu";
import { MoreVertical } from "ui/icon";
import { Skeleton } from "ui/skeleton";

import { PubRemoveButton } from "./PubRemoveButton";
import { PubUpdateButton } from "./PubUpdateButton";

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
					<Suspense fallback={<Skeleton className="h-9 w-full" />} key={pubId}>
						<PubUpdateButton
							button={{
								variant: "ghost",
								title: "Edit Pub",
								className: "w-full justify-start",
							}}
							pubId={pubId}
						/>
					</Suspense>
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
