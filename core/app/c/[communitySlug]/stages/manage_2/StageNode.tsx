import { memo } from "react";
import { Handle, Position } from "reactflow";

export const StageNode = memo(() => {
	return (
		<>
			<Handle type="target" position={Position.Left} />
			<Handle type="target" position={Position.Top} />
			<Handle type="source" position={Position.Right} />
			<Handle type="source" position={Position.Bottom} />
			<div contentEditable>Stage</div>
		</>
	);
});
