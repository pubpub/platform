import type { Meta, StoryObj } from "@storybook/react";
import type { Node } from "prosemirror-model";

import React from "react";

import { MediaUpload } from "../components/menus/MediaUpload";
import { generateSignedAssetUploadUrl } from "./mockUtils";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
	title: "MediaUpload",
	component: MediaUpload,
	parameters: {},
	tags: ["autodocs"],
	argTypes: {},
} satisfies Meta<typeof MediaUpload>;

export default meta;

type Story = StoryObj<typeof meta>;
const pubId = "a85b4157-4a7f-40d8-bb40-d9c17a6c7a70";
const upload = (filename: string) => generateSignedAssetUploadUrl(`${pubId}/${filename}`);

const attrs = {
	id: "",
	class: null,
	alt: "cat.jpeg",
	src: "http://localhost:9000/assets.v7.pubpub.org/a85b4157-4a7f-40d8-bb40-d9c17a6c7a70/cat.jpeg",
	linkTo: "",
	width: 100,
	align: "center",
};

const node = {
	attrs,
} as unknown as Node;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
	args: {
		node,
	},
	render: function Render(args) {
		return (
			<div className="w-[300px]">
				<MediaUpload {...args} />
			</div>
		);
	},
};
