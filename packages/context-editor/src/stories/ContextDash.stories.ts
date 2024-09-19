import type { Meta, StoryObj } from "@storybook/react";

import EditorDash from "./EditorDash";
import initialDoc from "./initialDoc.json";
import initialPubs from "./initialPubs.json";
import initialTypes from "./initialTypes.json";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
	title: "EditorDash",
	component: EditorDash,
	parameters: {},
	tags: ["autodocs"],
	argTypes: {
		placeholder: { control: "text" },
	},
} satisfies Meta<typeof EditorDash>;

export default meta;

type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
	args: {
		placeholder: "Helloooo",
		initialDoc: initialDoc,
		pubTypes: initialTypes,
	},
};
