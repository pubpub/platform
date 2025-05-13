import type { Node } from "prosemirror-model";

import React from "react";

import { AdvancedOptions } from "./AdvancedOptions";
import { LinkMenu } from "./LinkMenu";

type Props = {
	node: Node;
	nodePos: number;
	onChange: (index: number, attrs: Record<string, unknown>) => void;
};

export const MarkMenu = (props: Props) => {
	return props.node.marks.map((mark, index) => {
		const key = `${mark.type.name}-${props.nodePos}`;
		const onChange = (attrs: Record<string, unknown>) => {
			props.onChange(index, attrs);
		};
		let menu = null;
		switch (mark.type.name) {
			case "link":
				menu = <LinkMenu mark={mark} onChange={onChange} key={key} />;
				break;
		}
		return (
			<>
				{menu}
				<AdvancedOptions node={props.node} nodePos={props.nodePos} onChange={onChange} />
			</>
		);
	});
};
