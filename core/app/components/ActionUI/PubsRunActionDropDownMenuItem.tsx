"use client";

import { DropdownMenuItem } from "ui/dropdown-menu";

export const PubsRunActionDropDownMenuItem = (props: Parameters<typeof DropdownMenuItem>[0]) => {
	return (
		<DropdownMenuItem
			{...props}
			onSelect={(evt) => {

				evt.preventDefault();
			}}
		></DropdownMenuItem>
	);
};
