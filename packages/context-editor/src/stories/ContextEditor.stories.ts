import type { Meta, StoryObj } from "@storybook/react";

import ContextEditor from "../ContextEditor";
import AtomRenderer from "./AtomRenderer";
import initialDoc from "./initialDoc.json";
import initialPubs from "./initialPubs.json";
import initialTypes from "./initialTypes.json";
import { getPubs } from "./mockUtils";

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
		pubTypes: initialTypes,
		pubId: "a85b4157-4a7f-40d8-bb40-d9c17a6c7a70",
		pubTypeId: "67704c04-4f04-46e9-b93e-e3988a992a9b",
		getPubs,
		onChange: (state) => {
			console.log(state);
		},
		getPubById: () => undefined,
		atomRenderingComponent: AtomRenderer,
	},
};
