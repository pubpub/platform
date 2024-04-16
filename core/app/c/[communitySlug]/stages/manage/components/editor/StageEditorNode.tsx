import { KeyboardEvent, memo, useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Handle, NodeProps, Position } from "reactflow";

import { Button } from "ui/button";
import { Settings } from "ui/icon";
import { cn, expect } from "utils";

import { StagePayload } from "~/lib/types";
import { useStages } from "../../StagesContext";

export const STAGE_NODE_WIDTH = 250;
export const STAGE_NODE_HEIGHT = 50;

export const StageEditorNode = memo((props: NodeProps<{ stage: StagePayload }>) => {
	const pathname = usePathname();
	const { updateStageName } = useStages();
	const [isEditingName, setIsEditingName] = useState(false);
	const members = useMemo(
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
	const nodeRef = useRef<HTMLDivElement>(null);
	const nameRef = useRef<HTMLHeadingElement>(null);

	const onDoubleClick = useCallback(() => {
		setIsEditingName(true);
		if (nameRef.current) {
			const range = document.createRange();
			const selection = window.getSelection()!;
			const selectionStart = nameRef.current.childNodes[0];
			range.setStart(selectionStart, 0);
			range.setEnd(selectionStart, selectionStart.textContent!.length);
			selection.removeAllRanges();
			selection.addRange(range);
		}
	}, []);

	const onKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (isEditingName && e.key === "Enter") {
				nameRef.current?.blur();
			}
		},
		[isEditingName]
	);

	const onBlur = useCallback(() => {
		if (isEditingName) {
			window.getSelection()?.removeAllRanges();
			if (nameRef.current) {
				updateStageName(props.data.stage.id, nameRef.current.textContent!);
			}
			setIsEditingName(false);
		}
	}, [isEditingName]);

	return (
		<div
			className={cn(
				"flex items-center justify-between rounded-md border bg-gray-100 p-1.5 text-xs shadow-md",
				props.selected ? "border-gray-800" : "border-gray-300"
			)}
			// Can't use Tailwind for dynamically computed styles
			style={{
				width: `${STAGE_NODE_WIDTH}px`,
				height: `${STAGE_NODE_HEIGHT}px`,
			}}
			onBlur={onBlur}
			onDoubleClick={onDoubleClick}
			onKeyDown={onKeyDown}
			ref={nodeRef}
			tabIndex={0}
			role="button"
		>
			<Handle type="target" position={Position.Left} />
			<Handle type="source" position={Position.Right} />
			<div className="flex flex-col">
				<div>
					<p
						className="nodrag inline cursor-text text-sm font-medium"
						contentEditable
						suppressContentEditableWarning
						ref={nameRef}
					>
						{props.data.stage.name}
					</p>
				</div>
				<ul className="m-0 flex list-none gap-2 p-0">
					<li>
						<Button variant="link" className="m-0 h-auto p-0 text-xs font-light">
							{props.data.stage.pubs.length} pubs
						</Button>
					</li>
					<li>
						<Button variant="link" className="m-0 h-auto p-0 text-xs font-light">
							{props.data.stage.actionInstances.length} actions
						</Button>
					</li>
					<li>
						<Button variant="link" className="m-0 h-auto p-0 text-xs font-light">
							{members.size} members
						</Button>
					</li>
				</ul>
			</div>
			<Link href={`${pathname}?editingStageId=${props.data.stage.id}`}>
				<Settings className="h-4 w-4" />
			</Link>
		</div>
	);
});
