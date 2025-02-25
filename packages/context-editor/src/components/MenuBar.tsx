import type { MarkType } from "prosemirror-model";
import type { Command, EditorState } from "prosemirror-state";
import type { ReactNode } from "react";

import React from "react";
import { usePluginViewContext } from "@prosemirror-adapter/react";
import { toggleMark } from "prosemirror-commands";

import { Button } from "ui/button";
import { cn } from "utils";

import { baseSchema } from "../schemas";
import { markIsActive } from "../utils/marks";

interface MenuItem {
	name: string;
	icon: ReactNode;
	type: MarkType; // eventually should also be NodeType
	command: Command;
}

const menuItems: MenuItem[] = [
	{
		name: "strong",
		icon: "B",
		type: baseSchema.marks.strong,
		command: toggleMark(baseSchema.marks.strong),
	},
	{
		name: "em",
		icon: <span className="italic">I</span>,
		type: baseSchema.marks.em,
		command: toggleMark(baseSchema.marks.em),
	},
];

export const MenuBar = () => {
	const { view } = usePluginViewContext();
	return (
		<div className="rounded border bg-slate-50">
			{menuItems.map((menuItem) => {
				const { name, icon, command, type } = menuItem;
				// Returns if given command can be applied at the cursor selection
				const isApplicable = command(view.state, undefined, view);
				const isActive = markIsActive(type, view.state);
				return (
					<Button
						key={name}
						onClick={() => {
							view.focus();
							command(view.state, view.dispatch, view);
						}}
						variant="ghost"
						size="sm"
						disabled={!isApplicable}
						type="button"
						className={cn("w-6 rounded-none", { "bg-slate-300": isActive })}
					>
						{icon}
					</Button>
				);
			})}
		</div>
	);
};
