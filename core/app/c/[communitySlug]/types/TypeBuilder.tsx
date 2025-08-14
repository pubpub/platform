"use client";

import type { DragEndEvent } from "@dnd-kit/core";
import type { Static } from "@sinclair/typebox";

import React, { useCallback, useId, useMemo, useReducer, useRef } from "react";
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { typeboxResolver } from "@hookform/resolvers/typebox";
import { zodResolver } from "@hookform/resolvers/zod";
import { Type } from "@sinclair/typebox";
import { CircleCheck, PlusCircle } from "lucide-react";
import { useFieldArray, useForm, useFormContext } from "react-hook-form";

import type { PubFieldsId } from "db/public";
import { CoreSchemaType } from "db/public";
import { logger } from "logger";
import { Button } from "ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "ui/form";
import { useUnsavedChangesWarning } from "ui/hooks";
import { Input } from "ui/input";
import { usePubFieldContext } from "ui/pubFields";
import { toast } from "ui/use-toast";

import type {
	FormBuilderSchema,
	FormElementData,
	PanelState,
} from "~/app/components/FormBuilder/types";
import type { GetPubTypesResult } from "~/lib/server";
import { saveForm } from "~/app/components/FormBuilder/actions";
import { BuilderProvider, useBuilder } from "~/app/components/FormBuilder/BuilderContext";
import { ElementPanel } from "~/app/components/FormBuilder/ElementPanel";
import { ButtonConfigurationForm } from "~/app/components/FormBuilder/ElementPanel/ButtonConfigurationForm";
import { InputComponentConfigurationForm } from "~/app/components/FormBuilder/ElementPanel/InputComponentConfigurationForm";
import { SelectAccess } from "~/app/components/FormBuilder/ElementPanel/SelectAccess";
import { SelectElement } from "~/app/components/FormBuilder/ElementPanel/SelectElement";
import { StructuralElementConfigurationForm } from "~/app/components/FormBuilder/ElementPanel/StructuralElementConfigurationForm";
import { FieldIcon } from "~/app/components/FormBuilder/FieldIcon";
import { elementPanelReducer } from "~/app/components/FormBuilder/FormBuilder";
import { SubmissionSettings } from "~/app/components/FormBuilder/SubmissionSettings";
import {
	formBuilderSchema,
	isButtonElement,
	isFieldInput,
	isStructuralElement,
} from "~/app/components/FormBuilder/types";
import { useIsChanged } from "~/app/components/FormBuilder/useIsChanged";
import { FormElement } from "~/app/components/forms/FormElement";
import { PanelHeader, PanelWrapper, SidePanel } from "~/app/components/SidePanel";
import { findRanksBetween, getRankAndIndexChanges } from "~/lib/rank";
import { renderWithPubTokens } from "~/lib/server/render/pub/renderWithPubTokens";
import { didSucceed, useServerAction } from "~/lib/serverActions";
import { updatePubType } from "./actions";
import { FieldThing } from "./FieldThing";

export const pubTypeSchema = Type.Object({
	name: Type.String(),
	description: Type.Optional(Type.String()),
	fields: Type.Array(
		Type.Object({
			id: Type.String(), // ignore this field
			fieldId: Type.String(),
			deleted: Type.Optional(Type.Boolean()),
			name: Type.String(),
			configured: Type.Optional(Type.Boolean()),
			added: Type.Optional(Type.Boolean()),
			updated: Type.Optional(Type.Boolean()),
			isRelation: Type.Boolean(),
			rank: Type.String(),
			slug: Type.String(),
			schemaName: Type.Enum(CoreSchemaType),
		})
	),
	titleField: Type.Optional(Type.String()),
});

export const TypeBuilder = ({
	pubType,
	id,
}: {
	pubType: GetPubTypesResult[number];
	id: string;
}) => {
	const [isChanged, setIsChanged] = useIsChanged();

	const defaultValues = useMemo(() => {
		return {
			fields: pubType.fields.map((field) => ({
				id: field.id,
				fieldId: field.id,
				name: field.name,
				slug: field.slug,
				schemaName: field.schemaName ?? CoreSchemaType.Null,
				rank: field.rank ?? "0",
				isRelation: field.isRelation,
				deleted: false,
				configured: false,
				added: false,
				updated: false,
			})),
			name: pubType.name,
			description: pubType.description ?? undefined,
			titleField: pubType.fields.find((field) => field.isTitle)?.id,
		};
	}, [pubType]);

	const form = useForm<Static<typeof pubTypeSchema>>({
		resolver: typeboxResolver(pubTypeSchema),
		values: defaultValues,
	});

	const sidebarRef = useRef(null);
	const [panelState, dispatch] = useReducer(elementPanelReducer, {
		state: "initial",
		backButton: null,
		selectedElementIndex: null,
		fieldsFilter: null,
		buttonId: null,
	});

	const { append, fields, move, remove, update } = useFieldArray<
		Static<typeof pubTypeSchema>,
		"fields",
		"id"
	>({
		name: "fields",
		control: form.control,
	});

	const formValues = form.watch();

	useUnsavedChangesWarning(form.formState.isDirty);

	React.useEffect(() => {
		setIsChanged(
			formValues.name !== pubType.name ||
				formValues.description !== pubType.description ||
				formValues.titleField !== pubType.fields.find((field) => field.isTitle)?.id ||
				formValues.fields.some((field) => field.deleted) ||
				formValues.fields.some((field) => field.added)
		);
	}, [formValues, pubType]);

	// const payload = useMemo(
	// 	() => preparePayload({ formValues, defaultValues }),
	// 	[formValues, defaultValues]
	// );

	// React.useEffect(() => {
	// 	setIsChanged(
	// 		payload.upserts.length > 0 || payload.deletes.length > 0 || payload.access != null
	// 	);
	// }, [payload]);

	const runUpdatePubType = useServerAction(updatePubType);

	console.log("titlefield", formValues.titleField);

	const onSubmit = async (formData: Static<typeof pubTypeSchema>) => {
		const result = await runUpdatePubType({
			pubTypeId: pubType.id,
			name: formData.name,
			description: formData.description,
			titleField: formData.titleField as PubFieldsId | undefined,
			fields: formData.fields.map((field) => ({
				id: field.fieldId as PubFieldsId,
				rank: field.rank,
				deleted: field.deleted ?? false,
			})),
		});
		if (didSucceed(result)) {
			toast({
				className: "rounded border-emerald-100 bg-emerald-50",
				action: (
					<div className="flex w-full gap-3 text-green-700">
						<CircleCheck className="" /> Form Successfully Saved
					</div>
				),
			});
		}
	};
	const addElement = useCallback(
		(element: Static<typeof pubTypeSchema>["fields"][number]) => {
			append(element);
		},
		[append]
	);
	const removeElement = useCallback(
		(index: number) => {
			const field = fields[index];
			if (field.fieldId) {
				update(index, { ...fields[index], deleted: true });
			} else {
				remove(index);
			}
		},
		[fields, update, remove]
	);
	const restoreElement = useCallback(
		(index: number) => update(index, { ...fields[index], deleted: false }),
		[fields]
	);
	const removeIfUnconfigured = useCallback(() => {
		if (panelState.selectedElementIndex === null || panelState.backButton !== "selecting") {
			return;
		}
		const field = fields[panelState.selectedElementIndex];
		if (field.configured === false) {
			remove(panelState.selectedElementIndex);
		}
	}, [fields, remove, panelState.selectedElementIndex]);

	// Update ranks and rhf field array position when elements are dragged
	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const changes = getRankAndIndexChanges(event, fields);
			if (changes) {
				// move doesn't trigger a rerender, so it's safe to chain these calls
				move(changes.activeIndex, changes.overIndex);
				update(changes.overIndex, {
					...fields[changes.activeIndex],
					rank: changes.rank,
					updated: true,
				});
			}
		},
		[fields]
	);

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	const titleField = form.watch("titleField");
	const dndContextId = useId();

	return (
		<>
			<div className="pr-[380px]">
				<BuilderProvider
					removeIfUnconfigured={removeIfUnconfigured}
					addElement={addElement}
					removeElement={removeElement}
					restoreElement={restoreElement}
					selectedElement={
						panelState.selectedElementIndex !== null
							? fields[panelState.selectedElementIndex]
							: undefined
					}
					elementsCount={fields.length}
					openConfigPanel={(index: number) =>
						dispatch({ eventName: "edit", selectedElementIndex: index })
					}
					openButtonConfigPanel={(id) =>
						dispatch({ eventName: "editButton", buttonId: id })
					}
					update={update}
					dispatch={dispatch}
					identity={pubType.id}
					stages={[]}
					isDirty={isChanged}
				>
					<Form {...form}>
						<form
							id={id}
							aria-label="Pub type builder"
							onSubmit={form.handleSubmit(onSubmit, (errors, event) =>
								logger.error({
									msg: "unable to submit form",
									errors,
									event,
									fields,
								})
							)}
						>
							<FormField
								control={form.control}
								name="fields"
								render={() => (
									<>
										<ol className="flex flex-col items-center justify-center gap-4 overflow-y-auto p-10">
											<DndContext
												id={dndContextId}
												modifiers={[
													restrictToVerticalAxis,
													restrictToParentElement,
												]}
												onDragEnd={handleDragEnd}
												sensors={sensors}
											>
												<SortableContext
													items={fields}
													strategy={verticalListSortingStrategy}
												>
													{fields.map((field, index) => (
														<FieldThing
															isTitle={titleField === field.fieldId}
															toggleTitle={() => {
																if (titleField === field.fieldId) {
																	form.setValue(
																		"titleField",
																		undefined
																	);
																} else {
																	form.setValue(
																		"titleField",
																		field.fieldId
																	);
																}
															}}
															key={field.fieldId}
															field={field}
															index={index}
															isEditing={
																panelState.selectedElementIndex ===
																index
															}
															isDisabled={
																panelState.selectedElementIndex !==
																	null &&
																panelState.selectedElementIndex !==
																	index
															}
														/>
													))}
												</SortableContext>
											</DndContext>
										</ol>
										<PanelWrapper sidebar={sidebarRef.current}>
											<FormItem className="relative flex h-screen flex-col">
												<PanelHeader
													// title={elementPanelTitles[panelState.state]}
													title="Fields"
													showCancel={!(panelState.state === "initial")}
													onCancel={() =>
														dispatch({ eventName: "cancel" })
													}
												/>
												<FormControl>
													<FieldPanel panelState={panelState} />
												</FormControl>
											</FormItem>
										</PanelWrapper>
									</>
								)}
							/>
						</form>
					</Form>
				</BuilderProvider>
			</div>
			<SidePanel ref={sidebarRef} />
		</>
	);
};

export const FieldPanel = ({ panelState }: { panelState: PanelState }) => {
	const {
		elementsCount,
		removeIfUnconfigured,
		dispatch,
		identity: id,
		selectedElement,
	} = useBuilder<Static<typeof pubTypeSchema>["fields"][number]>();

	switch (panelState.state) {
		case "initial":
			return (
				<div className="mb-4 flex flex-col gap-4">
					<p>This type has {elementsCount} fields.</p>
					<Button
						type="button"
						className="flex w-full items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600"
						size="lg"
						onClick={() => dispatch({ eventName: "add" })}
					>
						<PlusCircle /> Add New
					</Button>
					<div className="mt-8">
						<FormLabel className="text-gray-500">ID</FormLabel>
						<hr className="my-2" />
						<Input disabled value={id} />
					</div>
				</div>
			);
		case "selecting":
			return <SelectField panelState={panelState} />;
		case "editing": {
			if (panelState.selectedElementIndex === null) {
				return <div>No selected element</div>;
			}

			if (!selectedElement) {
				return <div>No selected element</div>;
			}

			// should never happen
			throw new Error(
				`Non-field and non-configuration input element selected in configuration form. This should never happen.`
			);
		}
	}
};

export const SelectField = ({ panelState }: { panelState: PanelState }) => {
	const fields = usePubFieldContext();

	const { elementsCount, dispatch, addElement } =
		useBuilder<Static<typeof pubTypeSchema>["fields"][number]>();
	const { getValues } = useFormContext<Static<typeof pubTypeSchema>>();
	const selectedFields = getValues()["fields"];

	const fieldButtons = Object.values(fields).map((field) => {
		const usedFields = selectedFields.map((e) => e.id);
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
		return (
			<Button
				type="button"
				variant="outline"
				key={field.id}
				className="flex h-[68px] flex-1 flex-shrink-0 justify-start gap-4 bg-white p-4"
				onClick={() => {
					addElement({
						id: field.id,
						fieldId: field.id,
						name: field.name,
						slug: field.slug,
						added: true,
						schemaName: field.schemaName || CoreSchemaType.Null,
						isRelation: field.isRelation,
						rank: findRanksBetween({
							start: selectedFields[elementsCount - 1]?.rank,
						})[0],
						configured: false,
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
		<div className="flex flex-grow flex-col data-[state=inactive]:hidden">
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
		</div>
	);
};
