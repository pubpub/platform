import type { Node } from "prosemirror-model";

import React from "react";

import { LinkMenu } from "./LinkMenu";

type Props = {
	node: Node;
	nodePos: number;
	onChange: (index: number, attrs: Record<string, unknown>) => void;
};

export const MarkMenu = (props: Props) => {
	return props.node.marks.map((mark, index) => {
		const key = `${mark.type.name}-${props.nodePos}`;
		let menu = null;
		switch (mark.type.name) {
			case "link":
				menu = (
					<LinkMenu
						mark={mark}
						onChange={(attrs) => {
							props.onChange(index, attrs);
						}}
						key={key}
					/>
				);
				break;
		}
		return menu;
	});
};
