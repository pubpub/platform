"use client";

import { Button } from "ui/button";
import { FormLabel } from "ui/form";
import { PlusCircle, X } from "ui/icon";
import { Input } from "ui/input";

import type { PanelState } from "../types";
import { useFormBuilder } from "../FormBuilderContext";
import { SubmissionSettings } from "../SubmissionSettings";
import { isFieldInput } from "../types";
import { ButtonConfigurationForm } from "./ButtonConfigurationForm";
import { InputElementConfigurationForm } from "./InputElementConfigurationForm";
import { SelectAccess } from "./SelectAccess";
import { SelectElement } from "./SelectElement";
import { StructuralElementConfigurationForm } from "./StructuralElementConfigurationForm";

type ElementPanelProps = {
	state: PanelState;
};

export const ElementPanel = ({ state }: ElementPanelProps) => {
	const { elementsCount, removeIfUnconfigured, dispatch, slug, selectedElement } =
		useFormBuilder();

	switch (state.state) {
		case "initial":
			return (
				<div className="mb-4 flex flex-col gap-4">
					<p>This form has {elementsCount} elements.</p>
					<Button
						type="button"
						className="flex w-full items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600"
						size="lg"
						onClick={() => dispatch({ eventName: "add" })}
					>
						<PlusCircle /> Add New
					</Button>
					<div className="mt-8">
						<FormLabel className="text-slate-500">Slug</FormLabel>
						<hr className="my-2" />
						<Input disabled value={slug} />
					</div>
					<SelectAccess />
					<SubmissionSettings />
				</div>
			);
		case "selecting":
			return <SelectElement state={state} />;
		case "editing":
			const ConfigForm =
				selectedElement && isFieldInput(selectedElement)
					? InputElementConfigurationForm
					: StructuralElementConfigurationForm;

			return (
				<>
					{state.selectedElementIndex === null ? (
						// Shouldn't be possible
						<div>No selected element</div>
					) : (
						<ConfigForm index={state.selectedElementIndex} />
					)}
				</>
			);
		case "editingButton":
			return (
				<>
					<ButtonConfigurationForm buttonIdentifier={state.buttonId} />
				</>
			);
	}
};
