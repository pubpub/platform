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

<<<<<<< HEAD:core/app/components/PubCRUD/PubDropDown.tsx
import { SkeletonButton } from "../skeletons/SkeletonButton";
import { PubIOButton } from "./PubIOButton";
import { PubRemoveButton } from "./PubRemoveButton";
=======
import { RemovePubButton } from "./RemovePubButton";
import { UpdatePubButton } from "./UpdatePubButton";
>>>>>>> Pub Editor (#626):core/app/components/pubs/PubDropDown.tsx

type Props = {
	pubId: PubsId;
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
<<<<<<< HEAD:core/app/components/PubCRUD/PubDropDown.tsx
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
=======
					<UpdatePubButton
						variant="ghost"
						size="sm"
						className="w-full justify-start"
						pubId={props.pubId}
						searchParams={{}}
					/>
>>>>>>> Pub Editor (#626):core/app/components/pubs/PubDropDown.tsx
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
