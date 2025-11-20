import type { Meta, StoryObj } from "@storybook/react-vite"
import type { EditorState } from "prosemirror-state"

import { useState } from "react"

import ContextEditor from "../ContextEditor"
import { baseSchema } from "../schemas"
import AtomRenderer from "./AtomRenderer"
// @ts-expect-error
import exampleHtml from "./doc.html?raw"
import docWithImage from "./docWithImage.json"
import initialDoc from "./initialDoc.json"
import initialTypes from "./initialTypes.json"
import { generateSignedAssetUploadUrl, getPubs } from "./mockUtils"

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
	title: "ContextEditor",
	component: ContextEditor,
	parameters: {},
	tags: ["autodocs"],
	argTypes: {
		placeholder: { control: "text" },
	},
} satisfies Meta<typeof ContextEditor>

export default meta

type Story = StoryObj<typeof meta>
const pubId = "a85b4157-4a7f-40d8-bb40-d9c17a6c7a70"
const upload = (filename: string) => generateSignedAssetUploadUrl(`${pubId}/${filename}`)

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
	args: {
		placeholder: "Helloooo",
		initialDoc: baseSchema.nodeFromJSON(initialDoc),
		pubTypes: initialTypes,
		pubId,
		pubTypeId: "67704c04-4f04-46e9-b93e-e3988a992a9b",
		getPubs,
		onChange: (_state) => {},
		getPubById: () => undefined,
		atomRenderingComponent: AtomRenderer,
		upload,
	},
}

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
		const [state, setState] = useState<EditorState | undefined>(undefined)

		return (
			<>
				<ContextEditor {...args} onChange={setState} />
				<pre className="text-xs" data-testid="prosemirror-state">
					{state ? JSON.stringify(state?.doc.toJSON(), null, 2) : "{}"}
				</pre>
			</>
		)
	},
}

export const WithImage: Story = {
	args: {
		initialDoc: baseSchema.nodeFromJSON(docWithImage),
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
		const [state, setState] = useState<EditorState | undefined>(undefined)

		return (
			<>
				<ContextEditor {...args} onChange={setState} />
				<pre className="text-xs" data-testid="prosemirror-state">
					{state ? JSON.stringify(state?.doc.toJSON(), null, 2) : "{}"}
				</pre>
			</>
		)
	},
}

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
		const [state, setState] = useState<EditorState | undefined>(undefined)
		return (
			<>
				<ContextEditor
					{...args}
					initialDoc={baseSchema.nodeFromJSON(exampleHtml)}
					onChange={setState}
				/>
				<pre className="text-xs" data-testid="prosemirror-state">
					{state ? JSON.stringify(state?.doc.toJSON(), null, 2) : "{}"}
				</pre>
			</>
		)
	},
}
