import type { PropsWithChildren } from "react";

import React, { createContext, useContext, useState } from "react";

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

	return <EditorContext.Provider value={value}>{props.children}</EditorContext.Provider>;
};

export const useEditorContext = () => useContext(EditorContext);
