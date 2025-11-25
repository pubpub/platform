import type { FieldArrayWithId } from "react-hook-form";

import { useId } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Markdown from "react-markdown";

import type { PubFieldsId } from "db/public";
import { Button } from "ui/button";
import { ArchiveRestore, GripVertical, Pencil, Trash } from "ui/icon";
import { usePubFieldContext } from "ui/pubFields";
import { cn } from "utils";

import type { FormBuilderSchema, InputElement, StructuralElement } from "./types";
import { useBuilder } from "./BuilderContext";
import { FieldIcon } from "./FieldIcon";
import { structuralElements } from "./StructuralElements";
import { isFieldInput, isStructuralElement } from "./types";

type FormElementProps = {
	element: FieldArrayWithId<FormBuilderSchema, "elements", "id">;
	index: number;
	isEditing: boolean;
	isDisabled: boolean;
};

export const FormElement = ({ element, index, isEditing, isDisabled }: FormElementProps) => {
	const { attributes, listeners, isDragging, setNodeRef, transform, transition } = useSortable({
		id: element.id,
		disabled: isDisabled,
	});

	const style = {
		transform: CSS.Translate.toString(transform),
		transition,
	};

	const pubFields = usePubFieldContext();
	const field = pubFields[element.fieldId as PubFieldsId];
	const labelName = field
		? (element.label ?? (element.config as any)?.label ?? field.name)
		: (element.label ?? element.elementId);

	const { openConfigPanel, removeElement, restoreElement } = useBuilder();

	const labelId = useId();

	const restoreRemoveButton = element.deleted ? (
		<>
			<div className="my-auto text-gray-500">Deleted on save</div>
			<Button
				type="button"
				disabled={isDisabled}
				variant="ghost"
				className="p-2 opacity-0 hover:bg-white group-focus-within:opacity-100 group-hover:opacity-100 [&_svg]:pointer-events-auto [&_svg]:hover:text-destructive"
				aria-label={`Restore ${labelName}`}
				onClick={() => {
					restoreElement(index);
				}}
				data-testid={`restore-${labelName}`}
			>
				<ArchiveRestore size={24} className="text-neutral-400" />
			</Button>
		</>
	) : (
		<Button
			type="button"
			disabled={isDisabled}
			variant="ghost"
			className="p-2 opacity-0 hover:bg-white group-focus-within:opacity-100 group-hover:opacity-100 [&_svg]:pointer-events-auto [&_svg]:hover:text-destructive"
			aria-label={`Delete ${labelName}`}
			data-testid={`delete-${labelName}`}
			onClick={() => {
				removeElement(index);
			}}
		>
			<Trash size={24} className="text-neutral-400" />
		</Button>
	);
	return (
		<li
			aria-labelledby={labelId}
			ref={setNodeRef}
			style={style}
			className={cn(
				"group flex min-h-[76px] flex-1 flex-shrink-0 items-center justify-between gap-3 self-stretch rounded border border-l-[12px] border-solid border-gray-200 border-l-emerald-100 bg-white p-3 pr-4",
				isEditing && "border-sky-500 border-l-blue-500",
				isDisabled && "cursor-auto opacity-50",
				isDragging && "z-10 cursor-grabbing",
				{
					"border-l-amber-200/70 bg-amber-50/30": element.updated && !element.added,
					"border-l-emerald-200 bg-emerald-50/30": element.added,
					"border-l-red-200 bg-red-50/30": element.deleted,
				}
			)}
		>
			<div className="flex flex-1 flex-shrink-0 flex-wrap justify-start gap-0.5">
				{isFieldInput(element) && (
					<FieldInputElement element={element} isEditing={isEditing} labelId={labelId} />
				)}
				{isStructuralElement(element) && (
					<StructuralElement element={element} isEditing={isEditing} labelId={labelId} />
				)}
				{isEditing ? (
					<div className="my-auto ml-auto text-xs text-blue-500">EDITING</div>
				) : (
					<div className="my-auto ml-auto flex gap-1">
						{restoreRemoveButton}
						<Button
							type="button"
							aria-label="Edit field"
							disabled={isDisabled || element.deleted}
							variant="ghost"
							className="p-2 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
							data-testid={`edit-${labelName}`}
							onClick={() => {
								openConfigPanel(index);
							}}
						>
							<Pencil size={24} className="text-neutral-400" />
						</Button>
						<Button
							type="button"
							aria-label={`Drag ${labelName}`}
							disabled={isDisabled || element.deleted}
							variant="ghost"
							className={cn(
								"p-1.5 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100",
								isDragging ? "cursor-grabbing" : "cursor-grab"
							)}
							{...listeners}
							{...attributes}
							tabIndex={0}
							data-testid={`drag-${labelName}`}
						>
							<GripVertical size={24} className="text-neutral-400" />
						</Button>
					</div>
				)}
			</div>
		</li>
	);
};

type FieldInputElementProps = {
	element: InputElement;
	isEditing: boolean;
	labelId?: string;
};
export const FieldInputElement = ({ element, isEditing, labelId }: FieldInputElementProps) => {
	const pubFields = usePubFieldContext();
	const field = pubFields[element.fieldId as PubFieldsId];

	return (
		<>
			<FieldIcon
				field={field}
				className={cn(
					"mr-4 mt-3 shrink-0",
					isEditing ? "text-blue-500" : "text-emerald-500",
					{
						"text-red-300": element.deleted,
						"text-amber-500": element.updated && !element.added,
						"text-emerald-700": element.added,
					}
				)}
			/>
			<div>
				<div className="text-gray-500">{field.slug}</div>
				<div
					id={labelId}
					className={cn("font-semibold", {
						"text-gray-500": element.deleted,
					})}
				>
					{(element.config as any)?.label ?? field.name}
					{element.required && <span className="text-destructive">* </span>}
				</div>
			</div>
		</>
	);
};

type StructuralElementProps = {
	element: StructuralElement;
	isEditing: boolean;
	labelId?: string;
};
const StructuralElement = ({ element, isEditing, labelId }: StructuralElementProps) => {
	const { Icon, name } = structuralElements[element.element];

	return (
		<div>
			<div className="flex items-center gap-2">
				<Icon
					size={20}
					className={cn("shrink-0", isEditing ? "text-blue-500" : "text-emerald-500", {
						"text-amber-500": element.updated && !element.added,
						"text-emerald-700": element.added,
						"text-red-300": element.deleted,
					})}
				/>
				<div id={labelId} className="text-gray-500">
					{name}
				</div>
			</div>
			<div className={cn("prose prose-sm", element.deleted ? "text-gray-500" : "")}>
				{/* TODO: sanitize links, truncate, generally improve styles for rendered content*/}
				<Markdown className="line-clamp-2">{element.content}</Markdown>
			</div>
		</div>
	);
};
