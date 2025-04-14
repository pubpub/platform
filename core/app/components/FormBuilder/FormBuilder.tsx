"use client";

import type { DragEndEvent } from "@dnd-kit/core";

import * as React from "react";
import { useCallback, useMemo, useReducer, useRef } from "react";
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";

import type {
	FormElementsId,
	FormsId,
	NewFormElements,
	NewFormElementToPubType,
	Stages,
} from "db/public";
import { formElementsInitializerSchema } from "db/public";
import { logger } from "logger";
import { Form, FormControl, FormField, FormItem } from "ui/form";
import { useUnsavedChangesWarning } from "ui/hooks";
import { CircleCheck } from "ui/icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";
import { TokenProvider } from "ui/tokens";
import { toast } from "ui/use-toast";

import type { FormBuilderSchema, FormElementData, PanelEvent, PanelState } from "./types";
import type { Form as PubForm } from "~/lib/server/form";
import { getRankAndIndexChanges } from "~/lib/rank";
import { renderWithPubTokens } from "~/lib/server/render/pub/renderWithPubTokens";
import { didSucceed, useServerAction } from "~/lib/serverActions";
import { PanelHeader, PanelWrapper, SidePanel } from "../SidePanel";
import { saveForm } from "./actions";
import { ElementPanel } from "./ElementPanel";
import { FormBuilderProvider } from "./FormBuilderContext";
import { FormElement } from "./FormElement";
import { formBuilderSchema, isButtonElement } from "./types";
import { useIsChanged } from "./useIsChanged";

const elementPanelReducer: React.Reducer<PanelState, PanelEvent> = (prevState, event) => {
	const { eventName } = event;
	switch (eventName) {
		case "filterFields":
			const { fieldsFilter } = event;
			return { ...prevState, fieldsFilter };
		case "cancel":
			return {
				state: "initial",
				selectedElementIndex: null,
				fieldsFilter: null,
				backButton: null,
				buttonId: null,
			};
		case "back":
			return {
				state: prevState.backButton ?? "initial",
				backButton: prevState.backButton === "selecting" ? "initial" : null,
				selectedElementIndex: null,
				fieldsFilter: null,
				buttonId: null,
			};
		case "add":
			if (prevState.state === "initial")
				return {
					...prevState,
					state: "selecting",
					fieldsFilter: null,
					backButton: "initial",
				};
			break;
		case "edit":
			const newBack = prevState.state === "editing" ? prevState.backButton : prevState.state;
			return {
				state: "editing",
				backButton: newBack,
				selectedElementIndex: event.selectedElementIndex,
				fieldsFilter: null,
				buttonId: null,
			};
		case "save":
			if (prevState.state === "editing")
				return { ...prevState, state: "initial", selectedElementIndex: null };
			if (prevState.state === "editingButton")
				return { ...prevState, state: "initial", buttonId: null };
			break;
		case "editButton":
			const buttonId = event.buttonId ?? null;
			return {
				...prevState,
				state: "editingButton",
				backButton: "initial",
				buttonId,
			};
	}
	return prevState;
};

const elementPanelTitles: Record<PanelState["state"], string> = {
	editing: "Configure element",
	selecting: "Add element",
	initial: "Elements",
	editingButton: "Edit Submission Button",
};

type Props = {
	pubForm: PubForm;
	id: string;
	stages: Stages[];
};

/**
 * Only sends the dirty fields to the server
 */
const preparePayload = ({
	formValues,
	defaultValues,
}: {
	defaultValues: FormBuilderSchema;
	formValues: FormBuilderSchema;
}) => {
	const { upserts, deletes, relatedPubTypes, deletedRelatedPubTypes } =
		formValues.elements.reduce<{
			upserts: NewFormElements[];
			deletes: FormElementsId[];
			relatedPubTypes: NewFormElementToPubType[];
			deletedRelatedPubTypes: FormElementsId[];
		}>(
			(acc, element, index) => {
				if (element.deleted) {
					if (element.elementId) {
						acc.deletes.push(element.elementId);
					}
				} else if (!element.elementId) {
					// Newly created elements have no elementId, so generate an id to use
					const id = crypto.randomUUID() as FormElementsId;
					acc.upserts.push(
						formElementsInitializerSchema.parse({
							formId: formValues.formId,
							...element,
							id,
						})
					);
					if (element.relatedPubTypes) {
						for (const pubTypeId of element.relatedPubTypes) {
							acc.relatedPubTypes.push({ A: id, B: pubTypeId });
						}
					}
				} else if (element.updated) {
					// check whether the element is reeeaally updated minus the updated field
					const { updated: _, id: _id, ...elementWithoutUpdated } = element;
					const { updated, id, ...rest } =
						defaultValues.elements.find((e) => e.elementId === element.elementId) ?? {};

					const defaultElement = rest as Omit<FormElementData, "updated" | "id">;

					if (JSON.stringify(defaultElement) === JSON.stringify(elementWithoutUpdated)) {
						return acc;
					}

					acc.upserts.push(
						formElementsInitializerSchema.parse({
							...element,
							formId: formValues.formId,
							id: element.elementId,
						})
					); // TODO: only update changed columns
					if (element.relatedPubTypes) {
						// If we are updating to an empty array and there were related pub types before, we should clear out all related pub types
						if (
							element.relatedPubTypes.length === 0 &&
							defaultElement.relatedPubTypes?.length
						) {
							acc.deletedRelatedPubTypes.push(element.elementId);
						} else {
							for (const pubTypeId of element.relatedPubTypes) {
								acc.relatedPubTypes.push({ A: element.elementId, B: pubTypeId });
							}
						}
					}
				}
				return acc;
			},
			{ upserts: [], deletes: [], relatedPubTypes: [], deletedRelatedPubTypes: [] }
		);

	const access = formValues.access !== defaultValues.access ? formValues.access : undefined;

	return {
		formId: formValues.formId,
		upserts,
		deletes,
		access,
		relatedPubTypes,
		deletedRelatedPubTypes,
	};
};

export function FormBuilder({ pubForm, id, stages }: Props) {
	const [isChanged, setIsChanged] = useIsChanged();

	const defaultValues = useMemo(() => {
		return {
			elements: pubForm.elements.map((e) => {
				// Do not include extra fields here
				const { slug, id, fieldName, ...rest } = e;
				// Rename id to avoid conflict with rhf generated id
				return { ...rest, elementId: id };
			}),
			access: pubForm.access,
			formId: pubForm.id,
		};
	}, [pubForm]);

	const form = useForm<FormBuilderSchema>({
		resolver: zodResolver(formBuilderSchema),
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

	const {
		append,
		fields: elements,
		move,
		remove,
		update,
	} = useFieldArray({
		name: "elements",
		control: form.control,
	});

	const formValues = form.getValues();

	useUnsavedChangesWarning(form.formState.isDirty);

	const payload = useMemo(
		() => preparePayload({ formValues, defaultValues }),
		[formValues, defaultValues]
	);

	React.useEffect(() => {
		setIsChanged(
			payload.upserts.length > 0 || payload.deletes.length > 0 || payload.access != null
		);
	}, [payload]);

	const runSaveForm = useServerAction(saveForm);

	const onSubmit = async (formData: FormBuilderSchema) => {
		const result = await runSaveForm(payload);
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
		(element: FormElementData) => {
			append(element);
		},
		[append]
	);
	const removeElement = useCallback(
		(index: number) => {
			const element = elements[index];
			if (element.elementId) {
				update(index, { ...elements[index], deleted: true });
			} else {
				remove(index);
			}
		},
		[elements, update, remove]
	);
	const restoreElement = useCallback(
		(index: number) => update(index, { ...elements[index], deleted: false }),
		[elements]
	);
	const removeIfUnconfigured = useCallback(() => {
		if (panelState.selectedElementIndex === null || panelState.backButton !== "selecting") {
			return;
		}
		const element = elements[panelState.selectedElementIndex];
		if (element.configured === false) {
			remove(panelState.selectedElementIndex);
		}
	}, [elements, remove, panelState.selectedElementIndex]);

	// Update ranks and rhf field array position when elements are dragged
	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const changes = getRankAndIndexChanges(event, elements);
			if (changes) {
				// move doesn't trigger a rerender, so it's safe to chain these calls
				move(changes.activeIndex, changes.overIndex);
				update(changes.overIndex, {
					...elements[changes.activeIndex],
					rank: changes.rank,
					updated: true,
				});
			}
		},
		[elements]
	);

	const tokens = { content: renderWithPubTokens };

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	console.log(payload);

	return (
		<TokenProvider tokens={tokens}>
			<FormBuilderProvider
				removeIfUnconfigured={removeIfUnconfigured}
				addElement={addElement}
				removeElement={removeElement}
				restoreElement={restoreElement}
				selectedElement={
					panelState.selectedElementIndex !== null
						? elements[panelState.selectedElementIndex]
						: undefined
				}
				elementsCount={elements.length}
				openConfigPanel={(index: number) =>
					dispatch({ eventName: "edit", selectedElementIndex: index })
				}
				openButtonConfigPanel={(id) => dispatch({ eventName: "editButton", buttonId: id })}
				update={update}
				dispatch={dispatch}
				slug={pubForm.slug}
				stages={stages}
				isDirty={isChanged}
			>
				<Tabs defaultValue="builder" className="pr-[380px]">
					<div className="px-6">
						<TabsList className="mb-2 mt-4">
							<TabsTrigger value="builder">Builder</TabsTrigger>
							<TabsTrigger value="preview">Preview</TabsTrigger>
						</TabsList>
						<TabsContent value="builder" tabIndex={-1}>
							<Form {...form}>
								<form
									id={id}
									aria-label="Form builder"
									onSubmit={form.handleSubmit(onSubmit, (errors, event) =>
										logger.error({
											msg: "unable to submit form",
											errors,
											event,
											elements,
										})
									)}
								>
									<FormField
										control={form.control}
										name="elements"
										render={() => (
											<>
												<ol className="flex flex-col items-center justify-center gap-4 overflow-y-auto">
													<DndContext
														modifiers={[
															restrictToVerticalAxis,
															restrictToParentElement,
														]}
														onDragEnd={handleDragEnd}
														sensors={sensors}
													>
														<SortableContext
															items={elements}
															strategy={verticalListSortingStrategy}
														>
															{elements.map(
																(element, index) =>
																	!isButtonElement(element) && (
																		<FormElement
																			key={element.id}
																			element={element}
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
																	)
															)}
														</SortableContext>
													</DndContext>
												</ol>
												<PanelWrapper sidebar={sidebarRef.current}>
													<FormItem className="relative flex h-screen flex-col">
														<PanelHeader
															title={
																elementPanelTitles[panelState.state]
															}
															showCancel={
																!(panelState.state === "initial")
															}
															onCancel={() =>
																dispatch({ eventName: "cancel" })
															}
														/>
														<FormControl>
															<ElementPanel panelState={panelState} />
														</FormControl>
													</FormItem>
												</PanelWrapper>
											</>
										)}
									/>
								</form>
							</Form>
						</TabsContent>
						<TabsContent value="preview">Preview your form here</TabsContent>
					</div>
				</Tabs>
				<SidePanel ref={sidebarRef} />
			</FormBuilderProvider>
		</TokenProvider>
	);
}
