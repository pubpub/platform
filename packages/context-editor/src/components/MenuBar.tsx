import type { ReactNode } from "react";

import React from "react";
import { usePluginViewContext } from "@prosemirror-adapter/react";
import { Bold, Italic, Quote, SquareFunction } from "lucide-react";

import { Button } from "ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";
import { cn } from "utils";

import type { CommandSpec } from "../commands/types";
import {
	blockquoteToggle,
	heading1Toggle,
	heading2Toggle,
	heading3Toggle,
	heading4Toggle,
	heading5Toggle,
	heading6Toggle,
	paragraphToggle,
} from "../commands/blocks";
import { emToggle, strongToggle } from "../commands/marks";
import { insertNodeIntoEditor } from "../utils/nodes";

type MenuItemBase = {
	key: string;
	name: string;
	icon: ReactNode;
};

type MenuItem = MenuItemBase & ({ command: CommandSpec } | { insertNodeType: string });
type ParagraphSelectorItem = MenuItemBase & { command: CommandSpec };

const menuItems: MenuItem[] = [
	{
		key: "strong",
		name: "Bold",
		icon: <Bold />,
		command: strongToggle,
	},
	{
		key: "em",
		name: "Italic",
		icon: <Italic />,
		command: emToggle,
	},
	{
		key: "blockquote",
		name: "Blockquote",
		icon: <Quote />,
		command: blockquoteToggle,
	},
	{
		key: "math",
		name: "Math",
		icon: <SquareFunction />,
		insertNodeType: "math_inline",
	},
];

const paragraphTypeItems: ParagraphSelectorItem[] = [
	{
		key: "paragraph",
		name: "Paragraph",
		icon: "Paragraph",
		command: paragraphToggle,
	},
	{
		key: "h1",
		name: "Heading 1",
		icon: <span className="text-3xl font-bold">Heading 1</span>,
		command: heading1Toggle,
	},
	{
		key: "h2",
		name: "Heading 2",
		icon: <span className="text-2xl font-bold">Heading 2</span>,
		command: heading2Toggle,
	},
	{
		key: "h3",
		name: "Heading 3",
		icon: <span className="text-xl">Heading 3</span>,
		command: heading3Toggle,
	},
	{
		key: "h4",
		name: "Heading 4",
		icon: <span className="text-lg">Heading 4</span>,
		command: heading4Toggle,
	},
	{
		key: "h5",
		name: "Heading 5",
		icon: <span className="text-base">Heading 5</span>,
		command: heading5Toggle,
	},
	{
		key: "h6",
		name: "Heading 6",
		icon: <span className="text-sm font-normal">Heading 6</span>,
		command: heading6Toggle,
	},
];

const ParagraphDropdown = () => {
	const { view } = usePluginViewContext();
	const activeType = paragraphTypeItems.find((item) => item.command(view)(view.state).isActive);

	return (
		<Select
			value={activeType?.key}
			onValueChange={(value) => {
				const item = paragraphTypeItems.find((i) => i.key === value);
				if (!item) {
					return;
				}

				const { run } = item.command(view)(view.state);
				view.focus();
				run();
			}}
			disabled={!activeType}
		>
			<SelectTrigger className="w-fit border-none">
				<SelectValue placeholder="Paragraph">
					{activeType ? activeType.name : "Paragraph"}
				</SelectValue>
			</SelectTrigger>
			<SelectContent className="bg-white">
				{paragraphTypeItems.map(({ key, icon }) => {
					return (
						<SelectItem key={key} value={key}>
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
			className="flex items-center gap-1 rounded border bg-slate-50"
			role="toolbar"
			aria-label="Formatting tools"
		>
			<div className="border-r-2">
				<ParagraphDropdown />
			</div>
			<div className="flex gap-1">
				{menuItems.map((menuItem) => {
					const { key, name, icon } = menuItem;
					let canRun = true;
					// TODO: this isn't right
					let isActive = false;
					let run: () => void;
					if ("command" in menuItem) {
						const { command } = menuItem;
						({ run, canRun, isActive } = command(view)(view.state));
					} else {
						run = () => insertNodeIntoEditor(view, menuItem.insertNodeType);
					}
					return (
						<Button
							key={key}
							onClick={() => {
								view.focus();
								run();
							}}
							variant="ghost"
							size="sm"
							disabled={!canRun}
							type="button"
							className={cn("w-6 rounded-none", {
								"bg-slate-300 hover:bg-slate-400": isActive,
							})}
							title={name}
						>
							{icon}
						</Button>
					);
				})}
			</div>
		</div>
	);
};
