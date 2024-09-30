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
import { RemovePubButton } from "./RemovePubButton";
import { UpdatePubButton } from "./UpdatePubButton";

type Props = {
	pubId: PubsId;
	searchParams: Record<string, unknown>;
};

export const PubDropDown = (props: Props) => {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="sm" data-testid="pub-dropdown-button">
					<MoreVertical size="12" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="width">
				<DropdownMenuItem asChild>
					<Suspense fallback={<SkeletonButton />} key={props.pubId}>
						<UpdatePubButton
							variant="ghost"
							size="sm"
							className="w-full justify-start"
							pubId={props.pubId}
							searchParams={props.searchParams}
						/>
					</Suspense>
				</DropdownMenuItem>
				<DropdownMenuItem asChild>
					<RemovePubButton
						pubId={props.pubId}
						variant="ghost"
						className="w-full justify-start"
					/>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
