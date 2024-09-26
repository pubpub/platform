// Adapted from https://github.com/shadcn-ui/ui/blob/94ee191d989cf93246f2feaca68b1fdb24c18940/apps/www/registry/stories/button.stories.tsx

import type { Meta, StoryObj } from "@storybook/react";

import React from "react";
import { fn } from "@storybook/test";

import { Button } from "../button";
import { Loader2, Mail } from "../icon";

const meta: Meta<typeof Button> = {
	title: "Button",
	component: Button,
	tags: ["autodocs"],
	argTypes: {},
	args: { children: "Button", onClick: fn() },
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Base: Story = {
	args: { children: "Button" },
};
export const Outline: Story = {
	args: {
		variant: "outline",
	},
};
export const Ghost: Story = {
	args: {
		variant: "ghost",
	},
};
export const Secondary: Story = {
	args: {
		variant: "secondary",
	},
};
export const Link: Story = {
	args: {
		variant: "link",
	},
};
export const Loading: Story = {
	render: (args) => (
		<Button {...args}>
			<Loader2 className="mr-2 h-4 w-4 animate-spin" />
			Button
		</Button>
	),
	args: {
		variant: "outline",
	},
};
export const WithIcon: Story = {
	render: (args) => (
		<Button {...args}>
			<Mail className="mr-2 h-4 w-4" /> Login with Email Button
		</Button>
	),
	args: {
		variant: "secondary",
	},
};
