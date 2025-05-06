import type { Node } from "prosemirror-model";
import type { PropsWithChildren } from "react";

import React, { createContext, useContext, useState } from "react";

type ContextProps = {
	activeNode: Node | null;
	position: number;
};
type Props = PropsWithChildren<ContextProps>;

const EditorContext = createContext<
	{
		setActiveNode: (node: Node | null) => void;
		setPosition: (pos: number) => void;
	} & ContextProps
>({
	setActiveNode: () => {},
	setPosition: () => {},
	activeNode: null,
	position: 0,
});

export const EditorContextProvider = (props: Props) => {
	const [activeNode, setActiveNode] = useState(props.activeNode);
	const [position, setPosition] = useState(props.position);

	const value = { activeNode, position, setActiveNode, setPosition };

	return <EditorContext.Provider value={value}>{props.children}</EditorContext.Provider>;
};

export const useEditorContext = () => useContext(EditorContext);
