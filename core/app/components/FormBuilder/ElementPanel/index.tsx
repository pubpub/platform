"use client";

import { Button } from "ui/button";
import { FormLabel } from "ui/form";
import { ChevronLeft, PlusCircle, Type, X } from "ui/icon";
import { Input } from "ui/input";

import type { PanelState } from "../types";
import { useFormBuilder } from "../FormBuilderContext";
import { SubmissionSettings } from "../SubmissionSettings";
import { ButtonConfigurationForm } from "./ButtonConfigurationForm";
import { ElementConfigurationForm } from "./ElementConfigurationForm";
import { SelectAccess } from "./SelectAccess";
import { SelectElement } from "./SelectElement";

type ElementPanelProps = {
	state: PanelState;
};
export const ElementPanel = ({ state }: ElementPanelProps) => {
	const { elementsCount, removeIfUnconfigured, dispatch, slug } = useFormBuilder();

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
			return (
				<>
					<Button
						onClick={() => {
							removeIfUnconfigured();
							dispatch({ eventName: "back" });
						}}
						aria-label="Back"
					>
						<ChevronLeft />
					</Button>
					<div className="flex w-full flex-grow gap-3">
						{state.selectedElementIndex === null ? (
							// Shouldn't be possible
							<div>No selected element</div>
						) : (
							<ElementConfigurationForm index={state.selectedElementIndex} />
						)}
					</div>
				</>
			);
		case "editingButton":
			return (
				<>
					<Button
						aria-label="Back"
						variant="ghost"
						size="sm"
						className="absolute right-3 top-1"
						onClick={() => {
							dispatch({ eventName: "back" });
						}}
					>
						<X size="16px" className="text-muted-foreground" />
					</Button>
					<ButtonConfigurationForm buttonIdentifier={state.buttonId} />
				</>
			);
	}
};
