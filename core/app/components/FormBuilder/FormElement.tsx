import type { FieldArrayWithId } from "react-hook-form";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { PubFieldsId } from "db/public";
import { Button } from "ui/button";
import { GripVertical, Pencil, Type } from "ui/icon";
import { usePubFieldContext } from "ui/pubFields";

import type { FormBuilderSchema, FormElementData } from "./types";
import { useFormBuilder } from "./FormBuilderContext";
import { isFieldInput } from "./types";

type FormElementProps = {
	element: FieldArrayWithId<FormBuilderSchema, "elements", "id">;
	index: number;
};

export const FormElement = ({ element, index }: FormElementProps) => {
	const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
		id: element.id,
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	const { setEditingElement: setSelectedElement } = useFormBuilder();

	const pubFields = usePubFieldContext();
	if (isFieldInput(element)) {
		const field = pubFields[element.fieldId as PubFieldsId];
		return (
			<div
				ref={setNodeRef}
				style={style}
				{...attributes}
				className="flex flex-1 flex-shrink-0 items-center justify-between gap-3 self-stretch rounded border border-l-[12px] border-solid border-gray-200 border-l-emerald-100 bg-white p-3 pr-4"
			>
				{isFieldInput(element) && (
					<div className="group flex flex-1 flex-shrink-0 flex-wrap justify-start gap-0.5">
						<Type size={20} className="my-auto mr-4 text-emerald-500" />
						<div>
							<div className="text-muted-foreground">{field.slug}</div>
							<div className="font-semibold">{element.label ?? field.name}</div>
						</div>
						<div className="ml-auto hidden gap-1 group-hover:flex">
							<Button
								variant="ghost"
								className="p-2"
								onClick={() => setSelectedElement(index)}
							>
								<Pencil size={24} className="text-neutral-400" />
							</Button>
							<Button variant="ghost" className="p-1.5" {...listeners}>
								<GripVertical size={24} className="text-neutral-400" />
							</Button>
						</div>
					</div>
				)}
			</div>
		);
	}
	return <></>;
};
