import type { Meta, StoryObj } from "@storybook/react";

import { ContextEditor } from "../ContextEditor";
import initialDoc from "./initialDoc.json";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
	title: "ContextEditor",
	component: ContextEditor,
	parameters: {},
	tags: ["autodocs"],
	argTypes: {
		placeholder: { control: "text" },
	},
} satisfies Meta<typeof ContextEditor>;

export default meta;

type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
	args: {
		placeholder: "Helloooo",
		initialDoc: initialDoc,
	},
};
