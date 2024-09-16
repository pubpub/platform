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

import { SkeletonButton } from "../skeletons/SkeletonButton";
import { PubIOButton } from "./PubIOButton";
import { PubRemoveButton } from "./PubRemoveButton";

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
					<Suspense fallback={<SkeletonButton />} key={pubId}>
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
					</Suspense>
				</DropdownMenuItem>
				<DropdownMenuItem asChild>
					<PubRemoveButton pubId={pubId} button={{
							variant: "ghost",
							title: "Remove Pub",
							className: "w-full justify-start",
						}}/>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
