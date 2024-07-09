import React from "react";

import { Button } from "ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "ui/dropdown-menu";
import { Archive, Ellipsis } from "ui/icon";

type Props = {
	dropdownButtons: React.ReactNode[];
};

function TableActionDropDown(props: Props) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" className="h-8 w-8 p-0">
					<span className="sr-only">Open menu</span>
					<Ellipsis className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="p-0">
				{props.dropdownButtons.map((button, index) => (
					<React.Fragment key={index}>{button}</React.Fragment>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export default TableActionDropDown;
