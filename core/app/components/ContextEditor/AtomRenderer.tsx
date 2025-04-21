import type { NodeViewComponentProps } from "@handlewithcare/react-prosemirror";

import { forwardRef } from "react";
import { useIsNodeSelected } from "@handlewithcare/react-prosemirror";

import { cn } from "utils";

export const ContextAtom = forwardRef<HTMLDivElement, NodeViewComponentProps>(function ContextAtom(
	{ nodeProps, ...props },
	ref
) {
	const selected = useIsNodeSelected();
	const activeNode = nodeProps.node;
	if (!activeNode) {
		return null;
	}
	return (
		<section
			{...props}
			className={cn({ "border border-gray-500": selected })}
			role="presentation"
			ref={ref}
		>
			<pre className="text-sm">{JSON.stringify(activeNode, null, 2)}</pre>
		</section>
	);
});
