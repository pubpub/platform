import type { ReactNode } from "react";

import React from "react";
import { usePluginViewContext } from "@prosemirror-adapter/react";
import { Quote } from "lucide-react";

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

type MenuItem = {
	key: string;
	name?: string;
	icon: ReactNode;
	command: CommandSpec;
};

const menuItems: MenuItem[] = [
	{
		key: "strong",
		icon: "B",
		command: strongToggle,
	},
	{
		key: "em",
		icon: <span className="italic">I</span>,
		command: emToggle,
	},
	{
		key: "blockquote",
		icon: <Quote />,
		command: blockquoteToggle,
	},
];

const paragraphTypeItems: MenuItem[] = [
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
	const activeType = paragraphTypeItems.filter((item) => {
		const { isActive } = item.command(view)(view.state);
		return isActive;
	})[0];

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
					{activeType ? activeType.name || activeType.key : "Paragraph"}
				</SelectValue>
			</SelectTrigger>
			<SelectContent className="bg-white">
				{paragraphTypeItems.map(({ key, icon, command }) => {
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
			className="flex items-center rounded border bg-slate-50"
			role="toolbar"
			aria-label="Formatting tools"
		>
			{menuItems.map((menuItem) => {
				const { key, icon, command } = menuItem;
				const { run, canRun, isActive } = command(view)(view.state);
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
