// Adapted from https://gist.github.com/enesien/03ba5340f628c6c812b306da5fedd1a4

import type { Active, DragEndEvent } from "@dnd-kit/core";
import type { Dispatch, SetStateAction } from "react";

import React, { forwardRef, useState } from "react";
import { DndContext } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable } from "@dnd-kit/sortable";

import type { InputProps } from "./input";
import { Badge } from "./badge";
import { Button } from "./button";
import { GripVertical, XCircle } from "./icon";
import { Input } from "./input";

type MultiValueInputProps = Omit<InputProps, "onChange"> & {
	values: string[];
	onChange: Dispatch<SetStateAction<string[]>>;
};

const SortableValue = ({
	value,
	onRemove,
	isActive,
}: {
	value: string;
	onRemove: (v: string) => void;
	isActive: boolean;
}) => {
	const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: value });

	const style = transform
		? {
				transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
				transition,
				zIndex: isActive ? 50 : undefined,
			}
		: undefined;

	return (
		<Badge
			ref={setNodeRef}
			style={style}
			{...attributes}
			className="bg-muted-foreground py-1"
			data-testid={`sortable-value-${value}`}
		>
			<Button {...listeners} variant="ghost" className="mr-1 h-5 px-0">
				<GripVertical size="12" />
			</Button>
			{value}
			<Button
				onClick={() => {
					onRemove(value);
				}}
				variant="ghost"
				className="ml-2 h-3 p-0"
				data-testid="remove-button"
			>
				<XCircle size="12"></XCircle>
			</Button>
		</Badge>
	);
};

export const MultiValueInput = forwardRef<HTMLInputElement, MultiValueInputProps>(
	({ values, onChange, ...props }, ref) => {
		const [pendingValue, setPendingValue] = useState("");
		const [activeDrag, setActiveDrag] = useState<Active | null>(null);

		const addPendingValue = () => {
			if (pendingValue) {
				const newValues = new Set([...values, pendingValue]);
				onChange(Array.from(newValues));
				setPendingValue("");
			}
		};

		const handleDragEnd = (event: DragEndEvent) => {
			const { active, over } = event;
			if (over && active.id !== over.id) {
				const activeIndex: number = values.findIndex((v) => v === active.id);
				const overIndex: number = values.findIndex((v) => v === over.id);
				onChange(arrayMove(values, activeIndex, overIndex));
			}
			setActiveDrag(null);
		};

		return (
			<div className="isolate flex flex-col gap-2">
				<Input
					value={pendingValue}
					onChange={(e) => setPendingValue(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === ",") {
							e.preventDefault();
							addPendingValue();
						}
					}}
					placeholder="Type the value and hit enter"
					{...props}
					ref={ref}
					data-testid="multivalue-input"
				/>

				<DndContext
					onDragStart={({ active }) => {
						setActiveDrag(active);
					}}
					onDragEnd={handleDragEnd}
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
									/>
								);
							})}
						</div>
					</SortableContext>
				</DndContext>
			</div>
		);
	}
);

MultiValueInput.displayName = "MultiValueInput";
