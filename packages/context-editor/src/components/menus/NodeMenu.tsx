import React from "react";
import { Node } from "prosemirror-model";

import { FigureMenu } from "./FigureMenu";
import { MediaUpload } from "./MediaUpload";

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
		case "image": {
			menu = <MediaUpload node={props.node} />;
			break;
		}
	}

	return menu ? (
		<>
			{menu}
			<hr />
		</>
	) : null;
};
