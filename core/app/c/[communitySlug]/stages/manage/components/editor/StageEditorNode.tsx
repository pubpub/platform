import type { KeyboardEvent } from "react";
import type { NodeProps } from "reactflow";

import { memo, useCallback, useRef, useState } from "react";
import Link from "next/link";
import { Handle, Position } from "reactflow";

import type { StagesId } from "db/public";
import { Button } from "ui/button";
import { Settings } from "ui/icon";
import { cn } from "utils";

import type { CommunityStage } from "~/lib/server/stages";
import { useCommunity } from "~/app/components/providers/CommunityProvider";
import { constructStageMangePanel } from "~/lib/links";
import { slugifyString } from "~/lib/string";
import { useStages } from "../../StagesContext";

export const STAGE_NODE_WIDTH = 250;
export const STAGE_NODE_HEIGHT = 50;

export const StageEditorNode = memo((props: NodeProps<{ stage: CommunityStage }>) => {
	const community = useCommunity();
	const { updateStageName } = useStages();
	const [isEditingName, setIsEditingName] = useState(false);
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
				updateStageName(props.data.stage.id as StagesId, nameRef.current.textContent!);
			}
			setIsEditingName(false);
		}
	}, [isEditingName]);

	return (
		<div
			className={cn(
				"flex items-center justify-between rounded-md border bg-gray-100 p-1.5 text-xs shadow-md hover:cursor-grab active:cursor-grabbing",
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
			data-testid={`stage-${slugifyString(props.data.stage.name)}`}
		>
			<Handle
				type="target"
				position={Position.Left}
				data-testid={`move-constraint-target-handle`}
			/>
			<Handle
				type="source"
				position={Position.Right}
				data-testid={`move-constraint-source-handle`}
			/>
			<div className="flex flex-col">
				<div>
					<p
						className="nodrag inline cursor-text text-sm font-medium"
						contentEditable
						suppressContentEditableWarning
						ref={nameRef}
						aria-label="Edit stage name"
					>
						{props.data.stage.name}
					</p>
				</div>
				<ul className="m-0 flex list-none gap-2 p-0">
					<li>
						<Button
							variant="link"
							className="m-0 h-auto p-0 text-xs font-light"
							asChild
						>
							<Link
								href={constructStageMangePanel({
									stageId: props.data.stage.id,
									communitySlug: community.slug,
									tab: "pubs",
								})}
							>
								{props.data.stage.pubsCount} pubs
							</Link>
						</Button>
					</li>
					<li>
						<Button
							variant="link"
							className="m-0 h-auto p-0 text-xs font-light"
							asChild
						>
							<Link
								href={constructStageMangePanel({
									stageId: props.data.stage.id,
									communitySlug: community.slug,
									tab: "actions",
								})}
							>
								{props.data.stage.actionInstancesCount} actions
							</Link>
						</Button>
					</li>
					<li>
						<Button
							variant="link"
							className="m-0 h-auto p-0 text-xs font-light"
							asChild
						>
							<Link
								href={constructStageMangePanel({
									stageId: props.data.stage.id,
									communitySlug: community.slug,
									tab: "members",
								})}
							>
								{props.data.stage.memberCount} members
							</Link>
						</Button>
					</li>
				</ul>
			</div>
			<Link
				href={constructStageMangePanel({
					stageId: props.data.stage.id,
					communitySlug: community.slug,
					tab: "overview",
				})}
				aria-label="Configure stage"
			>
				<Settings className="h-4 w-4 hover:text-gray-700" />
			</Link>
		</div>
	);
});
