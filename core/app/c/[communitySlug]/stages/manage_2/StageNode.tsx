import { MouseEvent, memo, useCallback, useMemo } from "react";
import { Handle, NodeProps, Position } from "reactflow";
import { Button } from "ui/button";
import { StagePayload } from "~/lib/types";
import { cn, expect } from "utils";
import { Settings } from "ui/icon";
import { useStageEditor } from "./StageEditorContext";

export const STAGE_NODE_WIDTH = 250;
export const STAGE_NODE_HEIGHT = 50;

export const StageNode = memo((props: NodeProps<{ stage: StagePayload }>) => {
	const {} = useStageEditor();
	const memberships = useMemo(
		() =>
			props.data.stage.permissions.reduce((acc, permission) => {
				if (permission.memberGroup !== null) {
					for (const user of permission.memberGroup.users) {
						acc.add(user.id);
					}
				} else {
					acc.add(expect(permission.memberId));
				}
				return acc;
			}, new Set<string>()),
		[props.data]
	);

	const onClick = useCallback((e: MouseEvent) => {
		e.preventDefault();
	}, []);

	return (
		<div
			className={cn(
				"p-1.5 bg-gray-100 border rounded-md shadow-md text-xs flex items-center justify-between",
				props.selected ? "border-gray-800" : "border-gray-300"
			)}
			// Can't use Tailwind for dynamically computed styles, unfortunately
			style={{
				width: `${STAGE_NODE_WIDTH}px`,
				height: `${STAGE_NODE_HEIGHT}px`,
			}}
		>
			<Handle type="target" position={Position.Left} />
			<Handle type="source" position={Position.Right} />
			<div className="flex flex-col">
				<h3 className="font-medium text-sm">{props.data.stage.name}</h3>
				<ul className="p-0 m-0 list-none flex gap-2">
					<li>
						<Button variant="link" className="p-0 m-0 h-auto text-xs font-light">
							{props.data.stage.pubs.length} pubs
						</Button>
					</li>
					<li>
						<Button variant="link" className="p-0 m-0 h-auto text-xs font-light">
							0 actions
						</Button>
					</li>
					<li>
						<Button variant="link" className="p-0 m-0 h-auto text-xs font-light">
							{memberships.size} members
						</Button>
					</li>
				</ul>
			</div>
			<Button variant="ghost" size="icon" onClick={onClick} className="text-gray-300">
				<Settings className="h-4 w-4" />
			</Button>
		</div>
	);
});
