// Adapted from https://gist.github.com/enesien/03ba5340f628c6c812b306da5fedd1a4

import type { Active, DragEndEvent } from "@dnd-kit/core"
import type { Dispatch } from "react"
import type { InputProps } from "./input"

import React, { forwardRef, useState } from "react"
import { DndContext } from "@dnd-kit/core"
import { arrayMove, SortableContext, useSortable } from "@dnd-kit/sortable"

import { cn } from "utils"

import { Badge } from "./badge"
import { Button } from "./button"
import { GripVertical, XCircle } from "./icon"
import { Input } from "./input"

type MultiValueInputProps = Omit<InputProps, "onChange"> & {
	value: string[]
	onChange: Dispatch<string[]>
	/** Classname to apply to value badges */
	valueClassName?: string
}

const SortableValue = ({
	value,
	onRemove,
	isActive,
	disabled,
	className,
}: {
	value: string
	onRemove: (v: string) => void
	isActive: boolean
	disabled?: boolean
	className?: string
}) => {
	const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
		id: value,
		disabled,
	})

	const style = transform
		? {
				transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
				transition,
				zIndex: isActive ? 50 : undefined,
			}
		: undefined

	return (
		<Badge
			ref={setNodeRef}
			style={style}
			{...attributes}
			className={cn(
				"bg-muted-foreground py-1",
				{ "cursor-auto bg-gray-400 hover:bg-gray-400": disabled },
				className
			)}
			data-testid={`sortable-value-${value}`}
		>
			<Button {...listeners} variant="ghost" className="mr-1 h-5 p-0" disabled={disabled}>
				<GripVertical size="12" />
			</Button>
			{value}
			<Button
				onClick={() => {
					onRemove(value)
				}}
				variant="ghost"
				// height is smaller so hover is only over the xcircle
				className="ml-2 h-3 p-0"
				data-testid="remove-button"
				disabled={disabled}
			>
				<XCircle size="12"></XCircle>
			</Button>
		</Badge>
	)
}

export const MultiValueInput = forwardRef<HTMLInputElement, MultiValueInputProps>(
	({ value: values, onChange, valueClassName, disabled, ...props }, ref) => {
		const [pendingValue, setPendingValue] = useState("")
		const [activeDrag, setActiveDrag] = useState<Active | null>(null)

		const addPendingValue = () => {
			if (pendingValue) {
				const newValues = new Set([...values, pendingValue])
				onChange(Array.from(newValues))
				setPendingValue("")
			}
		}

		const handleDragEnd = (event: DragEndEvent) => {
			const { active, over } = event
			if (over && active.id !== over.id) {
				// biome-ignore lint/complexity/useIndexOf: wrong types otherwise
				const activeIndex: number = values.findIndex((v) => v === active.id)
				// biome-ignore lint/complexity/useIndexOf: wrong types otherwise
				const overIndex: number = values.findIndex((v) => v === over.id)
				onChange(arrayMove(values, activeIndex, overIndex))
			}
			setActiveDrag(null)
		}

		return (
			<div className="isolate flex flex-col gap-2">
				<Input
					value={pendingValue}
					onChange={(e) => setPendingValue(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === ",") {
							e.preventDefault()
							addPendingValue()
						}
					}}
					placeholder="Type the value and hit enter"
					disabled={disabled}
					{...props}
					ref={ref}
					data-testid="multivalue-input"
				/>

				<DndContext
					onDragStart={({ active }) => {
						setActiveDrag(active)
					}}
					onDragEnd={handleDragEnd}
					// Need an id or else will get an error in the console
					// https://github.com/clauderic/dnd-kit/issues/926
					id="multivalue-dnd-context"
				>
					<SortableContext items={values}>
						<div className="flex flex-wrap gap-x-2 gap-y-2">
							{values.map((value) => {
								return (
									<SortableValue
										key={value}
										value={value}
										onRemove={(valueToRemove) =>
											onChange(values.filter((v) => v !== valueToRemove))
										}
										isActive={activeDrag?.id === value}
										disabled={disabled}
										className={valueClassName}
									/>
								)
							})}
						</div>
					</SortableContext>
				</DndContext>
			</div>
		)
	}
)

MultiValueInput.displayName = "MultiValueInput"
