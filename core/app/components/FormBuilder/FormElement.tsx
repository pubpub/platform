import type { FieldArrayWithId } from "react-hook-form";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Markdown from "react-markdown";
import { SCHEMA_TYPES_WITH_ICONS } from "schemas";

import type { PubFieldsId } from "db/public";
import type { LucideIcon } from "ui/icon";
import { Button } from "ui/button";
import { ArchiveRestore, GripVertical, Pencil, Trash, Type } from "ui/icon";
import { usePubFieldContext } from "ui/pubFields";
import { cn } from "utils";

import type { FormBuilderSchema, InputElement, StructuralElement } from "./types";
import { useFormBuilder } from "./FormBuilderContext";
import { structuralElements } from "./StructuralElements";
import { isFieldInput, isStructuralElement } from "./types";

type FormElementProps = {
	element: FieldArrayWithId<FormBuilderSchema, "elements", "id">;
	index: number;
	isEditing: boolean;
	isDisabled: boolean;
};

export const FormElement = ({ element, index, isEditing, isDisabled }: FormElementProps) => {
	const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
		id: element.id,
		disabled: isDisabled,
	});

	const style = {
		transform: CSS.Translate.toString(transform),
		transition,
	};

	const { openConfigPanel, removeElement, restoreElement } = useFormBuilder();

	const restoreRemoveButton = element.deleted ? (
		<>
			<div className="my-auto text-slate-500">Deleted on save</div>
			<Button
				type="button"
				disabled={isDisabled}
				variant="ghost"
				className="invisible p-2 hover:bg-white group-hover:visible"
				aria-label="Restore element"
				onClick={() => {
					restoreElement(index);
				}}
			>
				<ArchiveRestore size={24} className="text-neutral-400 hover:text-red-500" />
			</Button>
		</>
	) : (
		<Button
			type="button"
			disabled={isDisabled}
			variant="ghost"
			className="invisible p-2 hover:bg-white group-hover:visible"
			aria-label="Delete element"
			onClick={() => {
				removeElement(index);
			}}
		>
			<Trash size={24} className="text-neutral-400 hover:text-red-500" />
		</Button>
	);
	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			className={cn(
				"flex min-h-[76px] flex-1 flex-shrink-0 items-center justify-between gap-3 self-stretch rounded border border-l-[12px] border-solid border-gray-200 border-l-emerald-100 bg-white p-3 pr-4",
				isEditing && "border-sky-500 border-l-blue-500",
				isDisabled && "cursor-auto opacity-50",
				element.deleted && "border-l-red-200"
			)}
		>
			<div className="group flex flex-1 flex-shrink-0 flex-wrap justify-start gap-0.5">
				{isFieldInput(element) && (
					<FieldInputElement element={element} isEditing={isEditing} />
				)}
				{isStructuralElement(element) && (
					<StructuralElement element={element} isEditing={isEditing} />
				)}
				{isEditing ? (
					<div className="my-auto ml-auto text-xs text-blue-500">EDITING</div>
				) : (
					<div className="my-auto ml-auto flex gap-1">
						{restoreRemoveButton}
						<Button
							type="button"
							disabled={isDisabled || element.deleted}
							variant="ghost"
							className="invisible p-2 group-hover:visible"
							onClick={() => {
								openConfigPanel(index);
							}}
						>
							<Pencil size={24} className="text-neutral-400" />
						</Button>
						<Button
							type="button"
							disabled={isDisabled || element.deleted}
							variant="ghost"
							className="invisible p-1.5 group-hover:visible"
							{...listeners}
						>
							<GripVertical size={24} className="text-neutral-400" />
						</Button>
					</div>
				)}
			</div>
		</div>
	);
};

type FieldInputElementProps = {
	element: InputElement;
	isEditing: boolean;
};
export const FieldInputElement = ({ element, isEditing }: FieldInputElementProps) => {
	const pubFields = usePubFieldContext();
	const field = pubFields[element.fieldId as PubFieldsId];
	let Icon: LucideIcon;
	if (!field.schemaName) {
		Icon = Type;
	} else {
		Icon = SCHEMA_TYPES_WITH_ICONS[field.schemaName].icon;
	}

	return (
		<>
			<Icon
				size={20}
				className={cn(
					"mr-4 mt-3 shrink-0",
					isEditing ? "text-blue-500" : "text-emerald-500",
					element.deleted && "text-slate-500"
				)}
			/>
			<div>
				<div className="text-slate-500">{field.slug}</div>
				<div className={cn("font-semibold", element.deleted ? "text-slate-500" : "")}>
					{element.label ?? field.name}
				</div>
			</div>
		</>
	);
};

type StructuralElementProps = {
	element: StructuralElement;
	isEditing: boolean;
};
const StructuralElement = ({ element, isEditing }: StructuralElementProps) => {
	const { Icon, name } = structuralElements[element.element];

	return (
		<>
			<Icon
				size={20}
				className={cn(
					"mr-4 mt-3 shrink-0",
					isEditing ? "text-blue-500" : "text-emerald-500",
					element.deleted && "text-slate-500"
				)}
			/>
			<div>
				<div className="text-slate-500">{name}</div>
				<div className={cn("prose prose-sm", element.deleted ? "text-slate-500" : "")}>
					{/* TODO: sanitize links, truncate, generally improve styles for rendered content*/}
					<Markdown className="line-clamp-2">{element.content}</Markdown>
				</div>
			</div>
		</>
	);
};
