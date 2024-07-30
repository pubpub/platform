"use client";

import React from "react";

import { logger } from "logger";
import AutoForm, { AutoFormSubmit } from "ui/auto-form";
import { Button } from "ui/button";

import { useFormBuilder } from "./FormBuilderContext";
import { structuralElements } from "./StructuralElements";
import { isStructuralElement } from "./types";

type Props = {
	index: number;
};

export const ConfigureElement = ({ index }: Props) => {
	const { selectedElement, update, dispatch, removeIfUnconfigured } = useFormBuilder();
	if (!selectedElement) {
		return null;
	}
	if (!isStructuralElement(selectedElement)) {
		return null;
	}
	console.log({
		msg: "configuring element",
		selectedElement,
		data: structuralElements[selectedElement.element],
	});
	const schema = structuralElements[selectedElement.element].schema;
	if (!schema) {
		return null;
	}

	return (
		<>
			{isStructuralElement(selectedElement) && (
				<AutoForm
					values={{ content: selectedElement.content }}
					formSchema={schema}
					onSubmit={(values) => {
						const { pubFields, content } = values;
						update(index, { ...selectedElement, content, configured: true });
						dispatch({ eventName: "save" });
					}}
					stopPropagation
				>
					<Button
						type="button"
						className="border-slate-950"
						variant="outline"
						onClick={() => {
							removeIfUnconfigured();
							dispatch({ eventName: "cancel" });
						}}
					>
						Cancel
					</Button>
					<Button type="submit" className="bg-blue-500 hover:bg-blue-600">
						Save
					</Button>
				</AutoForm>
			)}
		</>
	);
};
