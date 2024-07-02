import React from "react";

import { Button } from "ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "ui/dropdown-menu";
import { Archive, MoreVertical } from "ui/icon";

function TableActionDropDown() {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" className="h-8 w-8 p-0">
					<span className="sr-only">Open menu</span>
					<MoreVertical className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="p-0">
				<Button
					variant="outline"
					className=" min-w-full rounded-lg font-semibold shadow-md"
				>
					<Archive size={16} className="mr-2" />
					<div>Archive</div>
				</Button>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export default TableActionDropDown;
