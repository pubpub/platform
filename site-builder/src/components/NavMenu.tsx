import type { NonGenericProcessedPub } from "contracts";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "ui/dropdown-menu";
import { ChevronDown } from "ui/icon";

import { getFieldValue, getRelatedPubs } from "../lib/getValue";

export interface Props {
	navPub: NonGenericProcessedPub;
}

export default function NavMenu({ navPub }: Props) {
	// Extract the title from the pub
	const title = navPub.title || "Navigation";

	// Get navigation targets using the getRelatedPubs helper function
	const navTargets = getRelatedPubs(navPub, "Navigation Targets") || [];

	const getStringFieldValue = getFieldValue<string>;

	// Generate a unique ID for this specific dropdown to avoid conflicts when multiple dropdowns exist
	const uniqueId = `nav-menu-${navPub.id}`;
	const buttonId = `${uniqueId}-button`;
	const dropdownId = `${uniqueId}-dropdown`;

	return (
		<div className="relative inline-block text-left">
			<DropdownMenu>
				<DropdownMenuTrigger className="flex items-center gap-2">
					{title}
					<ChevronDown className="h-4 w-4" />
				</DropdownMenuTrigger>

				<DropdownMenuContent>
					{navTargets.map((target) => {
						if (!target) return null;

						const url =
							getStringFieldValue(target, "URL") ||
							`/${getStringFieldValue(target, "Slug") || ""}`;
						return (
							<DropdownMenuItem key={target.id}>
								<a className="w-full" href={url}>
									{target.title}
								</a>
							</DropdownMenuItem>
						);
					})}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
