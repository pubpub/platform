import { useId } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type Static } from "@sinclair/typebox";
import { ArchiveRestore, GripVertical, Pencil, Text, Trash, TypeOutline } from "lucide-react";

import { Button } from "ui/button";
import { cn } from "utils";

import { useBuilder } from "~/app/components/FormBuilder/BuilderContext";
import { FieldIcon } from "~/app/components/FormBuilder/FieldIcon";
import { pubTypeSchema } from "./TypeBuilder";

export type FieldThingProps = {
	field: Static<typeof pubTypeSchema>["fields"][number];
	isEditing: boolean;
	isDisabled: boolean;
	isTitle: boolean;
	index: number;
	toggleTitle: () => void;
};

export const FieldThing = ({
	field,
	index,
	isEditing,
	isDisabled,
	isTitle,
	toggleTitle,
}: FieldThingProps) => {
	const { attributes, listeners, isDragging, setNodeRef, transform, transition } = useSortable({
		id: field.id,
	});

	const style = {
		transform: CSS.Translate.toString(transform),
		transition,
	};

	const { openConfigPanel, removeElement, restoreElement } =
		useBuilder<Static<typeof pubTypeSchema>["fields"][number]>();
	const labelId = useId();

	const restoreRemoveButton = field.deleted ? (
		<>
			<div className="my-auto text-gray-500">Deleted on save</div>
			<Button
				type="button"
				disabled={isDisabled}
				variant="ghost"
				className="p-2 opacity-0 hover:bg-white group-focus-within:opacity-100 group-hover:opacity-100 [&_svg]:pointer-events-auto [&_svg]:hover:text-red-500"
				aria-label="Restore element"
				onClick={() => {
					restoreElement(index);
				}}
			>
				<ArchiveRestore size={24} className="text-neutral-400" />
			</Button>
		</>
	) : (
		<Button
			type="button"
			disabled={isDisabled}
			variant="ghost"
			className="p-2 opacity-0 hover:bg-white group-focus-within:opacity-100 group-hover:opacity-100 [&_svg]:pointer-events-auto [&_svg]:hover:text-red-500"
			aria-label="Delete element"
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
				field.deleted && "border-l-red-200",
				isDragging && "z-10 cursor-grabbing"
			)}
		>
			<div className="flex flex-1 flex-shrink-0 flex-wrap justify-start gap-0.5">
				<>
					<FieldIcon
						field={field}
						className={cn(
							"mr-4 mt-3 shrink-0",
							isEditing ? "text-blue-500" : "text-emerald-500",
							field.deleted && "text-gray-500"
						)}
					/>
					<div>
						<div className="text-gray-500">{field.slug}</div>
						<div
							id={labelId}
							className={cn("font-semibold", field.deleted ? "text-gray-500" : "")}
						>
							{field.name}
						</div>
					</div>
				</>
				{/* {isEditing ? (
					<div className="my-auto ml-auto text-xs text-blue-500">EDITING</div>
				) : ( */}
				<div className="my-auto ml-auto flex gap-1">
					<Button
						type="button"
						aria-label="Make title"
						disabled={isDisabled || field.deleted}
						variant="ghost"
						className={cn(
							"p-1.5 text-neutral-400 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100",
							"hover:bg-white hover:text-blue-500",
							isTitle && "text-blue-500 opacity-100"
						)}
						onClick={() => {
							toggleTitle();
						}}
						tabIndex={0}
					>
						<TypeOutline size={24} />
					</Button>

					{restoreRemoveButton}
					{/* Cant edit fields yet */}
					{/* <Button
							type="button"
							aria-label="Edit field"
							disabled={isDisabled || field.deleted}
							variant="ghost"
							className="p-2 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
							onClick={() => {
								openConfigPanel(index);
							}}
						>
							<Pencil size={24} className="text-neutral-400" />
						</Button> */}
					<Button
						type="button"
						aria-label="Drag handle"
						disabled={isDisabled || field.deleted}
						variant="ghost"
						className={cn(
							"p-1.5 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100",
							isDragging ? "cursor-grabbing" : "cursor-grab"
						)}
						{...listeners}
						{...attributes}
						tabIndex={0}
					>
						<GripVertical size={24} className="text-neutral-400" />
					</Button>
				</div>
				{/* )} */}
			</div>
		</li>
	);
};
