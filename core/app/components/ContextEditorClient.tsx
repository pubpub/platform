"use client";

import { ContextEditor } from "context-editor";

export const ContextEditorClient = () => {
	const pubId = "3a4f931e-8903-4023-aac7-8abf99238538";
	const pubTypeId = "b54cd264-8fe0-4a59-8e1b-0c66b82eca26";
	return (
		<ContextEditor
			pubId={pubId}
			pubTypeId={pubTypeId}
			pubTypes={{}}
			getPubs="todo"
			getPubById={() => {}}
			atomRenderingComponent={() => {}}
			onChange={(state) => {
				console.log({ state });
			}}
		/>
	);
};
