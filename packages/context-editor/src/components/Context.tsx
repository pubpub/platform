import type { PropsWithChildren } from "react";

import React, { createContext, useContext, useState } from "react";
import { useEditorEffect, useEditorState } from "@handlewithcare/react-prosemirror";

type Props = PropsWithChildren<{
	position: number | null;
}>;

type EditorContext = {
	position: number | null;
	setPosition: (pos: number | null) => void;
};

const EditorContext = createContext<EditorContext>({
	setPosition: () => {},
	position: 0,
});

export const EditorContextProvider = (props: Props) => {
	const [position, setPosition] = useState(props.position);
	const value = { position, setPosition };
	const state = useEditorState();
	useEditorEffect(() => {
		setPosition(state.selection.$from.pos);
	}, [state]);

	return <EditorContext.Provider value={value}>{props.children}</EditorContext.Provider>;
};

export const useEditorContext = () => useContext(EditorContext);
