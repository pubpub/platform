import mudder from "mudder";
import { useFormContext } from "react-hook-form";
import { defaultComponent } from "schemas";

import { ElementType, InputComponent, StructuralFormElement } from "db/public";
import { Button } from "ui/button";
import { Input } from "ui/input";
import { usePubFieldContext } from "ui/pubFields";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";

import type { FormElementData, PanelState } from "../types";
import { FieldIcon } from "../FieldIcon";
import { useFormBuilder } from "../FormBuilderContext";
import { structuralElements } from "../StructuralElements";

export const SelectElement = ({ panelState }: { panelState: PanelState }) => {
	const fields = usePubFieldContext();

	const { elementsCount, dispatch, addElement } = useFormBuilder();
	const { getValues } = useFormContext();
	const elements: FormElementData[] = getValues()["elements"];

	const fieldButtons = Object.values(fields).map((field) => {
		const usedFields = elements.map((e) => e.fieldId);
		if (
			usedFields.includes(field.id) ||
			field.isArchived ||
			(panelState.fieldsFilter &&
				!`${field.name} ${field.slug} ${field.schemaName}`.includes(
					panelState.fieldsFilter
				))
		) {
			return null;
		}

		const schemaName = field.schemaName;
		if (schemaName === null) {
			return null;
		}
		const component = defaultComponent(schemaName);
		return (
			<Button
				type="button"
				variant="outline"
				key={field.id}
				className="flex h-[68px] flex-1 flex-shrink-0 justify-start gap-4 bg-white p-4"
				onClick={() => {
					addElement({
						fieldId: field.id,
						required: true,
						type: ElementType.pubfield,
						rank: mudder.base62.mudder(elements[elementsCount - 1]?.rank, "", 1)[0],
						configured: false,
						config: field.isRelation
							? {
									relationshipConfig: {
										label: field.name,
										component: InputComponent.relationBlock,
									},
								}
							: { label: field.name },
						component,
						schemaName,
						isRelation: field.isRelation,
					});
					dispatch({
						eventName: "edit",
						selectedElementIndex: elementsCount,
					});
				}}
				data-testid={`field-button-${field.slug}`}
			>
				<FieldIcon field={field} className="my-auto text-emerald-500" />
				<div className="flex flex-col items-start text-left">
					<div className="text-muted-foreground">{field.slug}</div>
					<div className="text-left font-semibold">{field.name}</div>
				</div>
			</Button>
		);
	});
	return (
		<Tabs defaultValue="field" className="flex flex-grow flex-col">
			<TabsList>
				<TabsTrigger className="w-full" value="field">
					Field
				</TabsTrigger>
				<TabsTrigger className="w-full" value="structure">
					Structure
				</TabsTrigger>
			</TabsList>
			<TabsContent
				value="field"
				className="flex flex-grow flex-col data-[state=inactive]:hidden"
			>
				<Input
					type="search"
					placeholder="Type a field name to search..."
					aria-label="Type a field name to search"
					onChange={(event) => {
						dispatch({
							eventName: "filterFields",
							fieldsFilter: event.target.value,
						});
					}}
					value={panelState.fieldsFilter ?? ""}
					className="mb-2"
				></Input>
				<div className="mb-auto flex max-h-[calc(100vh-300px)] flex-col gap-2 overflow-y-auto">
					{fieldButtons}
				</div>

				<Button
					type="button"
					variant="outline"
					className="w-full border-gray-950"
					onClick={() => {
						dispatch({ eventName: "cancel" });
					}}
				>
					Cancel
				</Button>
			</TabsContent>
			<TabsContent value="structure" className="flex flex-grow flex-col">
				<div className="mb-auto flex flex-col justify-start gap-2 overflow-y-auto">
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
								className="flex h-[68px] justify-start gap-4 bg-white"
								onClick={() => {
									addElement({
										element: elementType,
										type: ElementType.structural,
										rank: mudder.base62.mudder(
											elements[elementsCount - 1]?.rank,
											"",
											1
										)[0],
										configured: false,
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
					className="mb-3 w-full border-gray-950"
					onClick={() => dispatch({ eventName: "cancel" })}
				>
					Cancel
				</Button>
			</TabsContent>
		</Tabs>
	);
};
