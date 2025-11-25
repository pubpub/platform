import type { Node } from "prosemirror-model"

import * as React from "react"

import { AdvancedOptions } from "./AdvancedOptions"
import { FigureMenu } from "./FigureMenu"
import { MediaUpload } from "./MediaUpload"

type NodeMenuProps = {
	node: Node
	nodePos: number
	onChange: (attrs: Record<string, unknown>) => void
}

export const NodeMenu = (props: NodeMenuProps) => {
	let menu: React.ReactNode = null

	switch (props.node.type.name) {
		case "figure": {
			menu = <FigureMenu {...props} />
			break
		}
		case "image": {
			menu = <MediaUpload {...props} />
			break
		}
	}

	return (
		<>
			{menu}
			<hr />
			<AdvancedOptions {...props} />
		</>
	)
}
