import type { Meta, StoryObj } from "@storybook/react";

import React, { useState } from "react";
import { ProseMirror } from "@handlewithcare/react-prosemirror";
import { EditorState } from "prosemirror-state";

import { EditorContextProvider } from "../components/Context";
import { MediaUpload } from "../components/menus/MediaUpload";
import AtomRenderer from "./AtomRenderer";
import initialDoc from "./initialDoc.json";
import initialPubs from "./initialPubs.json";
import initialTypes from "./initialTypes.json";
import { generateSignedAssetUploadUrl, getPubs } from "./mockUtils";

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
	credit: null,
	license: null,
	width: 100,
	align: "center",
};

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
	args: {
		attrs,
	},
	render: function Render(args) {
		return (
			<div className="w-[300px]">
				<ProseMirror>
					<EditorContextProvider activeNode={null} position={0}>
						<MediaUpload {...args} />
					</EditorContextProvider>
				</ProseMirror>
			</div>
		);
	},
};
