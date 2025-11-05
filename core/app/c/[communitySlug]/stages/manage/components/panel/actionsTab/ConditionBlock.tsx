"use client";

import type { DragEndEvent } from "@dnd-kit/core";

import { useCallback, useId, useState } from "react";
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useFieldArray, useFormContext } from "react-hook-form";

import { AutomationConditionBlockType } from "db/public";
import { Button } from "ui/button";
import { GripVertical, Plus, Trash } from "ui/icon";
import { Input } from "ui/input";
import { Label } from "ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";
import { cn } from "utils";

import { findRanksBetween, getRankAndIndexChanges } from "~/lib/rank";

export type ConditionBlockFormValue = {
	id?: string;
	kind: "block";
	type: AutomationConditionBlockType;
	rank: string;
	// conditions: ConditionFormValue[];
	// blocks: ConditionBlockFormValue[];
	items: ConditionItemFormValue[];
};

export type ConditionFormValue = {
	id?: string;
	kind: "condition";
	type: "jsonata";
	expression: string;
	rank: string;
};

export type ConditionItemFormValue = ConditionFormValue | ConditionBlockFormValue;

type ConditionItemProps = {
	id: string;
	expression: string;
	onRemove: () => void;
	slug: string;
};

const ConditionItem = ({ id, expression, onRemove, slug }: ConditionItemProps) => {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id,
	});
	const { register } = useFormContext();

	const style = {
		transform: CSS.Translate.toString(transform),
		transition,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={cn(
				"relative flex items-center gap-2 rounded border border-l-4 border-l-blue-100 bg-white p-2",
				isDragging && "z-10 cursor-grabbing"
			)}
		>
			<Button
				type="button"
				aria-label="Drag handle"
				variant="ghost"
				className={cn("cursor-grab p-1", isDragging && "cursor-grabbing")}
				{...listeners}
				{...attributes}
			>
				<GripVertical size={16} className="text-neutral-400" />
			</Button>
			<div className="flex-1">
				<Input
					{...register(slug)}
					placeholder="Enter JSONata expression (e.g., $.fieldName = 'value')"
					defaultValue={expression}
					className="text-sm"
				/>
			</div>
			<Button
				type="button"
				variant="ghost"
				className="p-1 text-neutral-400 hover:text-red-500"
				aria-label="Delete condition"
				onClick={onRemove}
			>
				<Trash size={16} />
			</Button>
		</div>
	);
};

type ConditionBlockProps = {
	id: string;
	slug: string;
	depth?: number;
	onRemove?: () => void;
};

export const ConditionBlock = ({ slug, depth = 0, onRemove, id }: ConditionBlockProps) => {
	const { control, watch, setValue } = useFormContext<Record<string, ConditionItemFormValue>>();
	const blockType = watch(`${slug}.type`) as AutomationConditionBlockType;

	const { fields, append, move, update, remove } = useFieldArray({
		control,
		name: `${slug}.items`,
	});

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	const itemId = useId();

	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const changes = getRankAndIndexChanges(event, fields);
			if (changes) {
				move(changes.activeIndex, changes.overIndex);
				const { id, ...movedField } = fields[changes.activeIndex];
				update(changes.overIndex, {
					...movedField,
					rank: changes.rank,
				});
			}
		},
		[move, update, fields]
	);

	const handleAdd = useCallback(
		(kind: "condition" | "block") => {
			const ranks = findRanksBetween({
				start: fields[fields.length - 1]?.rank,
				numberOfRanks: 1,
			});
			if (kind === "condition") {
				append({
					kind: "condition",
					type: "jsonata",
					expression: "",
					rank: ranks[0],
				});
				return;
			}
			append({
				kind: "block",
				type: AutomationConditionBlockType.AND,
				rank: ranks[0],
				items: [],
			});
		},
		[append, fields]
	);

	const handleRemove = useCallback(
		(index: number) => {
			remove(index);
		},
		[remove]
	);

	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id,
	});

	const isNot = blockType === AutomationConditionBlockType.NOT;
	const maxDepth = 3;
	const canNest = depth < maxDepth;

	const style = {
		transform: CSS.Translate.toString(transform),
		transition,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={cn(
				"relative flex items-start gap-2 rounded border p-3",

				"border-l-4 border-l-blue-100",
				isDragging && "z-10 cursor-grabbing",
				depth === 0 && "border-neutral-300 bg-neutral-50",
				depth === 1 && "border-neutral-200 bg-white",
				depth === 2 && "border-neutral-100 bg-neutral-50",
				depth >= 3 && "border-neutral-100 bg-white",
				depth > 0 && "p-2"
			)}
		>
			{depth > 0 && (
				<Button
					type="button"
					aria-label="Drag handle"
					variant="ghost"
					className={cn("cursor-grab p-1", isDragging && "cursor-grabbing")}
					{...listeners}
					{...attributes}
				>
					<GripVertical size={16} className="text-neutral-400" />
				</Button>
			)}
			<div className="flex-1">
				<div className="mb-3 flex items-center justify-between gap-2">
					<div className="flex items-center gap-2">
						{depth === 0 && (
							<Label className="text-xs font-semibold uppercase text-neutral-600">
								When
							</Label>
						)}
						<Select
							value={blockType}
							onValueChange={(value) =>
								setValue(`${slug}.type`, value as AutomationConditionBlockType)
							}
						>
							<SelectTrigger className="h-8 w-24 text-xs">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{Object.values(AutomationConditionBlockType).map((type) => (
									<SelectItem key={type} value={type}>
										{type}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					{depth > 0 && onRemove && (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="px-1 text-xs text-neutral-400 hover:text-red-500"
							onClick={onRemove}
						>
							<Trash size={14} />
						</Button>
					)}
				</div>

				<div className="space-y-2">
					<DndContext
						id={itemId}
						modifiers={[restrictToVerticalAxis, restrictToParentElement]}
						onDragEnd={handleDragEnd}
						sensors={sensors}
					>
						<SortableContext items={fields} strategy={verticalListSortingStrategy}>
							{fields.map((field, index) =>
								field.kind === "condition" ? (
									<ConditionItem
										key={field.id}
										id={field.id}
										expression={field.expression}
										onRemove={() => handleRemove(index)}
										slug={`${slug}.items.${index}.expression`}
									/>
								) : (
									<ConditionBlock
										key={field.id}
										id={field.id}
										depth={depth + 1}
										onRemove={() => handleRemove(index)}
										slug={`${slug}.items.${index}`}
									/>
								)
							)}
						</SortableContext>
					</DndContext>
					<div className="flex gap-2 pt-1">
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="h-8 text-xs"
							onClick={() => handleAdd("condition")}
							disabled={
								isNot &&
								fields.filter((field) => field.kind === "condition").length >= 1
							}
						>
							<Plus size={14} />
							Add condition
						</Button>
						{canNest && (
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="h-8 text-xs"
								onClick={() => handleAdd("block")}
								disabled={
									isNot &&
									(fields.filter((field) => field.kind === "condition").length >=
										1 ||
										fields.filter((field) => field.kind === "block").length >=
											1)
								}
							>
								<Plus size={14} />
								Add block
							</Button>
						)}
					</div>

					{isNot &&
						(fields.filter((field) => field.kind === "condition").length >= 1 ||
							fields.filter((field) => field.kind === "block").length >= 1) && (
							<p className="text-xs text-amber-600">
								NOT blocks can only contain one condition or one block
							</p>
						)}
				</div>
			</div>
		</div>
	);
};
