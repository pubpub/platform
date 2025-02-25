import type { ReactNode } from "react";

import React from "react";
import { usePluginViewContext } from "@prosemirror-adapter/react";

import { Button } from "ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "ui/dropdown-menu";
import { cn } from "utils";

import type { CommandSpec } from "../commands/types";
import { emToggle, strongToggle } from "../commands/marks";

type MenuItem = {
	name: string;
	icon: ReactNode;
	command: CommandSpec;
};

const menuItems: MenuItem[] = [
	{
		name: "strong",
		icon: "B",
		command: strongToggle,
	},
	{
		name: "em",
		icon: <span className="italic">I</span>,
		command: emToggle,
	},
];

// const paragraphTypeItems: MenuItem[] = [
// 	{
// 		name: "paragraph",
// 		icon: "Paragraph",
// 	},
// ];

const ParagraphDropdown = () => {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button size="sm" variant="ghost">
					Paragraph
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				<DropdownMenuItem>Paragraph</DropdownMenuItem>
				<DropdownMenuItem>Header 1</DropdownMenuItem>
				<DropdownMenuItem>Header 2</DropdownMenuItem>
				<DropdownMenuItem>Header 3</DropdownMenuItem>
				<DropdownMenuItem>Header 4</DropdownMenuItem>
				<DropdownMenuItem>Header 5</DropdownMenuItem>
				<DropdownMenuItem>Header 6</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export const MenuBar = () => {
	const { view } = usePluginViewContext();
	return (
		<div className="rounded border bg-slate-50" role="toolbar" aria-label="Formatting tools">
			{menuItems.map((menuItem) => {
				const { name, icon, command } = menuItem;
				const { run, canRun, isActive } = command(view)(view.state);
				return (
					<Button
						key={name}
						onClick={() => {
							view.focus();
							run();
						}}
						variant="ghost"
						size="sm"
						disabled={!canRun}
						type="button"
						className={cn("w-6 rounded-none", { "bg-slate-300": isActive })}
					>
						{icon}
					</Button>
				);
			})}
			<ParagraphDropdown />
		</div>
	);
};
