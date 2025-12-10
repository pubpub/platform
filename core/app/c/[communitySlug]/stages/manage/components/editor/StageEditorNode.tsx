import type { StagesId } from "db/public"
import type { KeyboardEvent } from "react"
import type { NodeProps } from "reactflow"
import type { CommunityStage } from "~/lib/server/stages"

import { memo, useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Handle, Position } from "reactflow"

import { Button } from "ui/button"
import { BookOpen, Bot, Settings, Users } from "ui/icon"
import { cn } from "utils"

import { useCommunity } from "~/app/components/providers/CommunityProvider"
import { constructStageMangePanel } from "~/lib/links"
import { slugifyString } from "~/lib/string"
import { useStages } from "../../StagesContext"
import { useEditingStageId } from "../panel/usePanelQueryParams"

export const STAGE_NODE_WIDTH = 250
export const STAGE_NODE_HEIGHT = 50

export const StageEditorNode = memo((props: NodeProps<{ stage: CommunityStage }>) => {
	const community = useCommunity()
	const { updateStageName, setActiveStageCooridnates } = useStages()
	const [isEditingName, setIsEditingName] = useState(false)
	const nodeRef = useRef<HTMLDivElement>(null)
	const nameRef = useRef<HTMLHeadingElement>(null)

	const onDoubleClick = useCallback(() => {
		setIsEditingName(true)
		if (nameRef.current) {
			const range = document.createRange()
			const selection = window.getSelection()!
			const selectionStart = nameRef.current.childNodes[0]
			range.setStart(selectionStart, 0)
			range.setEnd(selectionStart, selectionStart.textContent?.length ?? 0)
			selection.removeAllRanges()
			selection.addRange(range)
		}
	}, [])

	const onKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (isEditingName && e.key === "Enter") {
				nameRef.current?.blur()
			}
		},
		[isEditingName]
	)

	const onBlur = useCallback(() => {
		if (isEditingName) {
			window.getSelection()?.removeAllRanges()
			if (nameRef.current?.textContent) {
				updateStageName(props.data.stage.id as StagesId, nameRef.current.textContent!)
			}
			setIsEditingName(false)
		}
	}, [isEditingName])

	const { editingStageId } = useEditingStageId()
	const isCurrentStage = props.data.stage.id === editingStageId
	useEffect(() => {
		if (isCurrentStage) {
			const coordinates = nodeRef.current?.getBoundingClientRect()
			if (coordinates) {
				setActiveStageCooridnates({
					x: coordinates.left,
					y: coordinates.top,
					width: coordinates.width,
					height: coordinates.height,
				})
			}
		}
	}, [isCurrentStage, setActiveStageCooridnates, nodeRef])

	return (
		<div
			className={cn(
				"relative flex items-center justify-between rounded-lg border bg-gray-100 p-1.5 text-xs shadow-md hover:cursor-grab active:cursor-grabbing",
				props.selected ? "border-gray-800" : "border-gray-300",
				isCurrentStage ? "" : ""
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
					<span className="sr-only">Edit stage name</span>
					<p
						className="nodrag cursor-text font-medium text-sm"
						contentEditable
						onBeforeInput={() => {
							setIsEditingName(true)
						}}
						suppressContentEditableWarning
						ref={nameRef}
					>
						{props.data.stage.name}
					</p>
				</div>
				<ul className="m-0 flex list-none items-center justify-start gap-2 p-0">
					<li>
						<Button
							variant="link"
							className="!p-0 m-0 h-auto gap-1 font-light text-xs [&_svg]:size-3"
							asChild
						>
							<Link
								href={constructStageMangePanel({
									stageId: props.data.stage.id,
									communitySlug: community.slug,
									tab: "pubs",
								})}
								aria-label={`View Pubs in ${props.data.stage.name}`}
							>
								{props.data.stage.pubsCount} <span className="sr-only">Pubs</span>{" "}
								<BookOpen strokeWidth={1.2} />
							</Link>
						</Button>
					</li>
					<li>
						<Button
							variant="link"
							className="!p-0 m-0 h-auto gap-1 font-light text-xs [&_svg]:size-3.5"
							asChild
						>
							<Link
								href={constructStageMangePanel({
									stageId: props.data.stage.id,
									communitySlug: community.slug,
									tab: "automations",
								})}
								aria-label={`View Automations in ${props.data.stage.name}`}
							>
								{props.data.stage.automationsCount}
								<span className="sr-only">automations</span>
								<Bot strokeWidth={1.2} />
							</Link>
						</Button>
					</li>
					<li>
						<Button
							variant="link"
							className="!p-0 m-0 h-auto gap-1 font-light text-xs [&_svg]:size-3.5"
							asChild
						>
							<Link
								href={constructStageMangePanel({
									stageId: props.data.stage.id,
									communitySlug: community.slug,
									tab: "members",
								})}
								aria-label={`View Members in ${props.data.stage.name}`}
							>
								{props.data.stage.memberCount}{" "}
								<span className="sr-only">members</span>
								<Users strokeWidth={1.2} />
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
	)
})
