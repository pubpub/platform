import React from "react";
import { Node } from "prosemirror-model";

import { FigureMenu } from "./FigureMenu";

type NodeMenuProps = {
	node: Node;
	onChange: (values: Record<string, unknown>) => void;
};

export const NodeMenu = (props: NodeMenuProps) => {
	let menu: React.ReactNode = null;

	switch (props.node.type.name) {
		case "figure": {
			menu = <FigureMenu node={props.node} onChange={props.onChange} />;
			break;
		}
	}

	return (
		<div className="my-2 flex flex-col gap-2">
			<h2 className="text-md font-serif font-medium">{props.node.type.name}</h2>
			{menu}
		</div>
	);
};
