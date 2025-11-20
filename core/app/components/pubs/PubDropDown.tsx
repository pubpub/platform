import type { PubsId } from "db/public"

import Link from "next/link"

import { Button } from "ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "ui/dropdown-menu"
import { MoreVertical, Pencil } from "ui/icon"

import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug"
import { RemovePubButton } from "./RemovePubButton"

type Props = {
	pubId: PubsId
	searchParams: Record<string, unknown>
}

export const PubDropDown = async (props: Props) => {
	const communitySlug = await getCommunitySlug()
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="sm" data-testid="pub-dropdown-button">
					<MoreVertical size="12" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="width">
				<DropdownMenuItem asChild>
					<Button variant="ghost" size="sm" className="w-full border-0">
						<Link
							href={`/c/${communitySlug}/pubs/${props.pubId}/edit`}
							className="flex gap-1"
						>
							<Pencil size="12" className="mb-0.5" /> Update Pub
						</Link>
					</Button>
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
	)
}
