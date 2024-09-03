import { SCHEMA_TYPES_WITH_ICONS } from "schemas";

import { ElementType, StructuralFormElement } from "db/public";
import { Button } from "ui/button";
import { Type } from "ui/icon";
import { Input } from "ui/input";
import { usePubFieldContext } from "ui/pubFields";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";

import { useFormBuilder } from "../FormBuilderContext";
import { structuralElements } from "../StructuralElements";

export const SelectElement = (state) => {
	const fields = usePubFieldContext();

	const { elementsCount, dispatch, addElement } = useFormBuilder();

	const fieldButtons = Object.values(fields).map((field) => {
		if (
			field.isArchived ||
			(state.fieldsFilter &&
				!`${field.name} ${field.slug} ${field.schemaName}`.includes(state.fieldsFilter))
		) {
			return null;
		}
		const Icon = (field.schemaName && SCHEMA_TYPES_WITH_ICONS[field.schemaName]?.icon) || Type;
		return (
			<Button
				type="button"
				variant="outline"
				key={field.id}
				className="group flex flex-1 flex-shrink-0 justify-start gap-4 bg-white"
				onClick={() => {
					addElement({
						fieldId: field.id,
						required: true,
						type: ElementType.pubfield,
						order: elementsCount,
						configured: false,
					});
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
									addElement({
										element: elementType,
										type: ElementType.structural,
										order: elementsCount,
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
					className="w-full border-slate-950"
					onClick={() => dispatch({ eventName: "cancel" })}
				>
					Cancel
				</Button>
			</TabsContent>
		</Tabs>
	);
};
