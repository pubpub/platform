import type { Meta, StoryObj } from "@storybook/react-vite";

import React from "react";

import { baseSchema } from "../schemas";
import AtomRenderer from "./AtomRenderer";
import EditorDash from "./EditorDash/EditorDash";
import initialDoc from "./initialDoc.json";
import initialTypes from "./initialTypes.json";
import { generateSignedAssetUploadUrl, getPubs } from "./mockUtils";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
	title: "EditorDash",
	component: EditorDash,
	parameters: { layout: "fullscreen" },
	tags: ["autodocs"],
	argTypes: {
		placeholder: { control: "text" },
	},
} satisfies Meta<typeof EditorDash>;

export default meta;

type Story = StoryObj<typeof meta>;
const pubId = "a85b4157-4a7f-40d8-bb40-d9c17a6c7a70";

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
	args: {
		placeholder: "Helloooo",
		// initialHtml,
		pubTypes: initialTypes,
		pubId,
		pubTypeId: "67704c04-4f04-46e9-b93e-e3988a992a9b",
		onChange: (state) => {
			console.log(state);
		},
		getPubs,
		getPubById: () => undefined,
		atomRenderingComponent: AtomRenderer,
		upload: (filename) => generateSignedAssetUploadUrl(`${pubId}/${filename}`),
	},
	render: (args) => {
		return <EditorDash {...args} initialDoc={baseSchema.nodeFromJSON(initialDoc)} />;
	},
};
