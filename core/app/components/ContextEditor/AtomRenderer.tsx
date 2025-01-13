import { useNodeViewContext } from "@prosemirror-adapter/react"
import { Node } from "prosemirror-model"

import { cn } from "utils"

export const ContextAtom = ({ nodeProp }: { nodeProp: Node }) => {
	const { contentRef, node, selected } = useNodeViewContext()
	const activeNode = nodeProp || node
	if (!activeNode) {
		return null
	}
	return (
		<section
			className={cn({ "border border-gray-500": selected })}
			role="presentation"
			ref={contentRef}
		>
			<pre className="text-sm">{JSON.stringify(activeNode, null, 2)}</pre>
		</section>
	)
}
