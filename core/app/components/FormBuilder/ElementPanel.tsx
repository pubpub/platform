"use client";

import { SCHEMA_TYPES_WITH_ICONS } from "schemas";

import type { PubFieldsId } from "db/public";
import { ElementType, StructuralFormElement } from "db/public";
import { Button } from "ui/button";
import { FormLabel } from "ui/form";
import { ChevronLeft, PlusCircle, Type, X } from "ui/icon";
import { Input } from "ui/input";
import { usePubFieldContext } from "ui/pubFields";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";

import type { PanelState } from "./types";
import { ButtonConfigurationForm } from "./ButtonConfigurationForm";
import { ConfigureElement } from "./ConfigureElement";
import { useFormBuilder } from "./FormBuilderContext";
import { structuralElements } from "./StructuralElements";
import { SubmissionSettings } from "./SubmissionSettings";

type ElementPanelProps = {
	state: PanelState;
};
export const ElementPanel = ({ state }: ElementPanelProps) => {
	const fields = usePubFieldContext();

	const { addElement, elementsCount, removeIfUnconfigured, dispatch, slug } = useFormBuilder();

	const addToForm = (
		newElement:
			| { type: "structure"; element: StructuralFormElement }
			| { type: "field"; fieldId: PubFieldsId; label: string }
	) => {
		if (!newElement) {
			return;
		}
		if (newElement.type === "field") {
			addElement({
				...newElement,
				required: true,
				type: ElementType.pubfield,
				order: elementsCount,
				configured: false,
			});
		}
		if (newElement.type === "structure") {
			addElement({
				...newElement,
				type: ElementType.structural,
				order: elementsCount,
				configured: false,
			});
		}
	};

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
					<SubmissionSettings />
				</div>
			);
		case "selecting":
			const fieldButtons = Object.values(fields).map((field) => {
				if (
					field.isArchived ||
					(state.fieldsFilter &&
						!`${field.name} ${field.slug} ${field.schemaName}`.includes(
							state.fieldsFilter
						))
				) {
					return null;
				}
				const Icon =
					(field.schemaName && SCHEMA_TYPES_WITH_ICONS[field.schemaName]?.icon) || Type;
				return (
					<Button
						type="button"
						variant="outline"
						key={field.id}
						className="group flex flex-1 flex-shrink-0 justify-start gap-4 bg-white"
						onClick={() => {
							addToForm({ type: "field", fieldId: field.id, label: field.name });
							dispatch({
								eventName: "edit",
								selectedElementIndex: elementsCount,
							});
						}}
						data-testid={`field-button-${field.slug}`}
					>
						<Icon size={20} className="my-auto text-emerald-500" />
						<div className="flex flex-col items-start text-left">
							<div className="text-muted-foreground">{field.slug}</div>
							<div className="text-left font-semibold">{field.name}</div>
						</div>
					</Button>
				);
			});
			return (
				<Tabs defaultValue="field">
					<TabsList>
						<TabsTrigger value="field">Field</TabsTrigger>
						<TabsTrigger value="structure">Structure</TabsTrigger>
					</TabsList>
					<TabsContent value="field">
						<Input
							type="search"
							placeholder="Type a field name to search..."
							aria-label="Type a field name to search"
							onChange={(event) =>
								dispatch({
									eventName: "filterFields",
									fieldsFilter: event.target.value,
								})
							}
							value={state.fieldsFilter ?? ""}
							className="mb-2"
						></Input>
						<div className="flex max-h-[250px] flex-col gap-2 overflow-y-auto">
							{fieldButtons}
						</div>

						<Button
							type="button"
							variant="outline"
							className="w-full border-slate-950"
							onClick={() => {
								dispatch({ eventName: "cancel" });
							}}
						>
							Cancel
						</Button>
					</TabsContent>
					<TabsContent value="structure">
						<div className="flex max-h-[250px] flex-col gap-2 overflow-y-auto">
							{Object.values(StructuralFormElement).map((elementType) => {
								const { Icon, enabled, name } = structuralElements[elementType];
								if (!enabled) {
									return null;
								}
								return (
									<Button
										key={elementType}
										type="button"
										variant="outline"
										className="group flex flex-1 flex-shrink-0 justify-start gap-4 bg-white"
										onClick={() => {
											addToForm({
												type: "structure",
												element: elementType,
											});
											dispatch({
												eventName: "edit",
												selectedElementIndex: elementsCount,
											});
										}}
									>
										<Icon size={20} className="my-auto text-emerald-500" />
										<div>{name}</div>
									</Button>
								);
							})}
						</div>
						<Button
							type="button"
							variant="outline"
							className="w-full border-slate-950"
							onClick={() => dispatch({ eventName: "cancel" })}
						>
							Cancel
						</Button>
					</TabsContent>
				</Tabs>
			);
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
							<ConfigureElement index={state.selectedElementIndex} />
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
