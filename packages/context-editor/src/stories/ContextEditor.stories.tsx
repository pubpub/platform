import type { Meta, StoryObj } from "@storybook/react";

import React, { useState } from "react";
import { DOMParser } from "prosemirror-model";
import { EditorState } from "prosemirror-state";

import ContextEditor from "../ContextEditor";
import { baseSchema } from "../schemas";
import AtomRenderer from "./AtomRenderer";
import exampleHtml from "./doc.html?raw";
import docWithImage from "./docWithImage.json";
import initialDoc from "./initialDoc.json";
import initialPubs from "./initialPubs.json";
import initialTypes from "./initialTypes.json";
import { generateSignedAssetUploadUrl, getPubs } from "./mockUtils";

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
const pubId = "a85b4157-4a7f-40d8-bb40-d9c17a6c7a70";
const upload = (filename: string) => generateSignedAssetUploadUrl(`${pubId}/${filename}`);

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
	args: {
		placeholder: "Helloooo",
		initialDoc: initialDoc,
		pubTypes: initialTypes,
		pubId,
		pubTypeId: "67704c04-4f04-46e9-b93e-e3988a992a9b",
		getPubs,
		onChange: (state) => {
			console.log(state);
		},
		getPubById: () => undefined,
		atomRenderingComponent: AtomRenderer,
		upload,
	},
};

export const Blank: Story = {
	args: {
		initialDoc: undefined,
		pubTypes: initialTypes,
		pubId: "a85b4157-4a7f-40d8-bb40-d9c17a6c7a70",
		pubTypeId: "67704c04-4f04-46e9-b93e-e3988a992a9b",
		getPubs,
		onChange: () => {},
		getPubById: () => undefined,
		atomRenderingComponent: AtomRenderer,
		upload,
	},
	// Render the prosemirror doc on the screen for testing
	render: function Render(args) {
		const [state, setState] = useState<EditorState | undefined>(undefined);

		return (
			<>
				<ContextEditor {...args} onChange={setState} />
				<pre className="text-xs" data-testid="prosemirror-state">
					{state ? JSON.stringify(state?.doc.toJSON(), null, 2) : "{}"}
				</pre>
			</>
		);
	},
};

export const WithImage: Story = {
	args: {
		initialDoc: docWithImage,
		pubTypes: initialTypes,
		pubId: "a85b4157-4a7f-40d8-bb40-d9c17a6c7a70",
		pubTypeId: "67704c04-4f04-46e9-b93e-e3988a992a9b",
		getPubs,
		onChange: () => {},
		getPubById: () => undefined,
		atomRenderingComponent: AtomRenderer,
		upload,
	},
	// Render the prosemirror doc on the screen for testing
	render: function Render(args) {
		const [state, setState] = useState<EditorState | undefined>(undefined);

		return (
			<>
				<ContextEditor {...args} onChange={setState} />
				<pre className="text-xs" data-testid="prosemirror-state">
					{state ? JSON.stringify(state?.doc.toJSON(), null, 2) : "{}"}
				</pre>
			</>
		);
	},
};

export const ParseDOM: Story = {
	args: {
		pubTypes: initialTypes,
		pubId: "a85b4157-4a7f-40d8-bb40-d9c17a6c7a70",
		pubTypeId: "67704c04-4f04-46e9-b93e-e3988a992a9b",
		getPubs,
		onChange: () => {},
		getPubById: () => undefined,
		atomRenderingComponent: AtomRenderer,
		upload,
	},
	// Render the prosemirror doc on the screen for testing
	render: function Render(args) {
		const [state, setState] = useState<EditorState | undefined>(undefined);
		const template = document.createElement("template");
		template.innerHTML = exampleHtml;
		const content = template.content.firstElementChild;
		const doc = content ? DOMParser.fromSchema(baseSchema).parse(content).toJSON() : undefined;
		return (
			<>
				<ContextEditor {...args} initialDoc={doc} onChange={setState} />
				{/* {doc ? (
					<ContextEditor {...args} initialDoc={doc} onChange={setState} />
				) : (
					"Loading..."
				)} */}
				<pre className="text-xs" data-testid="prosemirror-state">
					{state ? JSON.stringify(state?.doc.toJSON(), null, 2) : "{}"}
				</pre>
			</>
		);
	},
};
