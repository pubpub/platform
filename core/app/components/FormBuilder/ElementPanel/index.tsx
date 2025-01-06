"use client";

import { Button } from "ui/button";
import { FormLabel } from "ui/form";
import { PlusCircle, X } from "ui/icon";
import { Input } from "ui/input";

import type { PanelState } from "../types";
import { useFormBuilder } from "../FormBuilderContext";
import { SubmissionSettings } from "../SubmissionSettings";
import { isFieldInput, isStructuralElement } from "../types";
import { ButtonConfigurationForm } from "./ButtonConfigurationForm";
import { InputComponentConfigurationForm } from "./InputComponentConfigurationForm";
import { SelectAccess } from "./SelectAccess";
import { SelectElement } from "./SelectElement";
import { StructuralElementConfigurationForm } from "./StructuralElementConfigurationForm";

type ElementPanelProps = {
	panelState: PanelState;
};

export const ElementPanel = ({ panelState }: ElementPanelProps) => {
	const { elementsCount, removeIfUnconfigured, dispatch, slug, selectedElement } =
		useFormBuilder();

	switch (panelState.state) {
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
			return <SelectElement panelState={panelState} />;
		case "editing": {
			if (panelState.selectedElementIndex === null) {
				return <div>No selected element</div>;
			}

			if (!selectedElement) {
				return <div>No selected element</div>;
			}

			if (isStructuralElement(selectedElement)) {
				return (
					<StructuralElementConfigurationForm
						index={panelState.selectedElementIndex}
						structuralElement={selectedElement}
					/>
				);
			}

			if (isFieldInput(selectedElement)) {
				return (
					<InputComponentConfigurationForm
						fieldInputElement={selectedElement}
						index={panelState.selectedElementIndex}
					/>
				);
			}

			// should never happen
			throw new Error(
				`Non-field and non-configuration input element selected in configuration form. This should never happen.`
			);
		}
		case "editingButton":
			return (
				<>
					<ButtonConfigurationForm buttonIdentifier={panelState.buttonId} />
				</>
			);
	}
};
