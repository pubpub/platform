import type { ReactNode } from "react";

import React from "react";
import { usePluginViewContext } from "@prosemirror-adapter/react";

import { Button } from "ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";
import { cn } from "utils";

import type { CommandSpec } from "../commands/types";
import {
	heading1Toggle,
	heading2Toggle,
	heading3Toggle,
	heading4Toggle,
	heading5Toggle,
	heading6Toggle,
	paragraphToggle,
} from "../commands/blocks";
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

const paragraphTypeItems: MenuItem[] = [
	{
		name: "paragraph",
		icon: "Paragraph",
		command: paragraphToggle,
	},
	{
		name: "h1",
		icon: <span className="text-3xl font-bold">Heading 1</span>,
		command: heading1Toggle,
	},
	{
		name: "h2",
		icon: <span className="text-2xl font-bold">Heading 2</span>,
		command: heading2Toggle,
	},
	{
		name: "h3",
		icon: <span className="text-xl">Heading 3</span>,
		command: heading3Toggle,
	},
	{
		name: "h4",
		icon: <span className="text-lg">Heading 4</span>,
		command: heading4Toggle,
	},
	{
		name: "h5",
		icon: <span className="text-base">Heading 5</span>,
		command: heading5Toggle,
	},
	{
		name: "h6",
		icon: <span className="text-sm font-normal">Heading 6</span>,
		command: heading6Toggle,
	},
];

const ParagraphDropdown = () => {
	const { view } = usePluginViewContext();
	return (
		<Select
			defaultValue={paragraphTypeItems[0].name}
			onValueChange={(value) => {
				const item = paragraphTypeItems.find((i) => i.name === value);
				if (!item) {
					return;
				}

				const { run } = item.command(view)(view.state);
				view.focus();
				run();
			}}
		>
			<SelectTrigger className="w-fit border-none">
				<SelectValue placeholder="Theme" />
			</SelectTrigger>
			<SelectContent className="bg-white">
				{paragraphTypeItems.map(({ name, icon, command }) => {
					return (
						<SelectItem key={name} value={name}>
							{icon}
						</SelectItem>
					);
				})}
			</SelectContent>
		</Select>
	);
};

export const MenuBar = () => {
	const { view } = usePluginViewContext();
	return (
		<div
			className="flex items-center rounded border bg-slate-50"
			role="toolbar"
			aria-label="Formatting tools"
		>
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
