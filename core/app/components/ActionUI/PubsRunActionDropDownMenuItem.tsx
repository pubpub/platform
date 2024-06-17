"use client";

import { DropdownMenuItem } from "ui/dropdown-menu";

export const PubsRunActionDropDownMenuItem = (props: Parameters<typeof DropdownMenuItem>[0]) => {
	return (
		<DropdownMenuItem
			{...props}
			onSelect={(evt) => {
				// prevents the dropdown from closing when clicking on the action
				evt.preventDefault();
			}}
		></DropdownMenuItem>
	);
};
