import React from "react";
import { usePluginViewContext } from "@prosemirror-adapter/react";
import { toggleMark } from "prosemirror-commands";

import { Button } from "ui/button";

import { baseSchema } from "../schemas";

const menuItems = [
	{
		name: "strong",
		icon: "B",
		command: toggleMark(baseSchema.marks.strong),
	},
	{
		name: "em",
		icon: "I",
		command: toggleMark(baseSchema.marks.em),
	},
];

export const MenuBar = () => {
	const { view } = usePluginViewContext();
	return (
		<div className="border">
			{menuItems.map((menuItem) => {
				const { name, icon, command } = menuItem;
				return (
					<Button
						key={name}
						onClick={() => {
							command(view.state, view.dispatch, view);
						}}
						variant="ghost"
						size="sm"
					>
						{icon}
					</Button>
				);
			})}
		</div>
	);
};
