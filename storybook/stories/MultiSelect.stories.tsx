import type { Meta, StoryObj } from "@storybook/react";

import { fn } from "@storybook/test";

import { MultiSelect } from "ui/multi-select";

const meta: Meta<typeof MultiSelect> = {
	title: "MultiSelect",
	component: MultiSelect,
	tags: ["autodocs"],
	argTypes: {},
	args: { onValueChange: fn() },
};
export default meta;

type Story = StoryObj<typeof MultiSelect>;

export const NoneSelected: Story = {
	args: {
		defaultValue: [],
		options: [
			{ label: "Cat", value: "cat" },
			{ label: "Dog", value: "dog" },
			{ label: "Squirrel", value: "squirrel" },
		],
	},
};

export const Selected: Story = {
	args: {
		defaultValue: ["cat", "dog"],
		options: [
			{ label: "Cat", value: "cat" },
			{ label: "Dog", value: "dog" },
			{ label: "Squirrel", value: "squirrel" },
		],
	},
};
