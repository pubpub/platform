"use client";

import * as React from "react";
import { useCallback, useReducer, useRef } from "react";
import { DndContext } from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPortal } from "react-dom";
import { useFieldArray, useForm } from "react-hook-form";

import type { Stages } from "db/public";
import { logger } from "logger";
import { Button } from "ui/button";
import { Form, FormControl, FormField, FormItem } from "ui/form";
import { CircleCheck, X } from "ui/icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";
import { TokenProvider } from "ui/tokens";
import { toast } from "ui/use-toast";

import type { FormBuilderSchema, FormElementData, PanelEvent, PanelState } from "./types";
import type { Form as PubForm } from "~/lib/server/form";
import { renderWithPubTokens } from "~/lib/server/render/pub/renderWithPubTokens";
import { didSucceed, useServerAction } from "~/lib/serverActions";
import { saveForm } from "./actions";
import { ElementPanel } from "./ElementPanel";
import { FormBuilderProvider, useFormBuilder } from "./FormBuilderContext";
import { FormElement } from "./FormElement";
import { formBuilderSchema, isButtonElement } from "./types";

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

const PanelHeader = ({ state }: { state: PanelState["state"] }) => {
	const { dispatch } = useFormBuilder();
	return (
		<>
			<div className="flex items-center justify-between">
				<div className="text-sm uppercase text-slate-500">{elementPanelTitles[state]}</div>
				{state !== "initial" && (
					<Button
						aria-label="Cancel"
						variant="ghost"
						size="sm"
						className=""
						onClick={() => dispatch({ eventName: "cancel" })}
					>
						<X size={16} className="text-muted-foreground" />
					</Button>
				)}
			</div>
			<hr />
		</>
	);
};

type Props = {
	pubForm: PubForm;
	id: string;
	stages: Stages[];
};

// Render children in a portal so they can safely use <form> components
function PanelWrapper({
	children,
	sidebar,
}: {
	children: React.ReactNode;
	sidebar: Element | null;
}) {
	if (!sidebar) {
		return null;
	}
	return createPortal(children, sidebar);
}

export function FormBuilder({ pubForm, id, stages }: Props) {
	const form = useForm<FormBuilderSchema>({
		resolver: zodResolver(formBuilderSchema),
		values: {
			elements: pubForm.elements.map((e) => {
				// Do not include schemaName or slug here
				const { slug, ...rest } = e;
				return rest;
			}),
			access: pubForm.access,
			formId: pubForm.id,
		},
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

	const runSaveForm = useServerAction(saveForm);
	const onSubmit = async (formData: FormBuilderSchema) => {
		//TODO: only submit dirty fields
		const result = await runSaveForm(formData);
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
		if (panelState.selectedElementIndex === null) {
			return;
		}
		const element = elements[panelState.selectedElementIndex];
		if (element.configured === false) {
			remove(panelState.selectedElementIndex);
		}
	}, [elements, remove, panelState.selectedElementIndex]);

	const tokens = { content: renderWithPubTokens };

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
				elementsCount={elements.filter((e) => !isButtonElement(e)).length}
				openConfigPanel={(index: number) =>
					dispatch({ eventName: "edit", selectedElementIndex: index })
				}
				openButtonConfigPanel={(id) => dispatch({ eventName: "editButton", buttonId: id })}
				update={update}
				dispatch={dispatch}
				slug={pubForm.slug}
				stages={stages}
			>
				<Tabs defaultValue="builder" className="pr-[380px]">
					<div className="px-6">
						<TabsList className="mb-2 mt-4">
							<TabsTrigger value="builder">Builder</TabsTrigger>
							<TabsTrigger value="preview">Preview</TabsTrigger>
						</TabsList>
						<TabsContent value="builder">
							<Form {...form}>
								<form
									id={id}
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
												<div className="flex flex-col items-center justify-center gap-4 overflow-y-auto">
													<DndContext
														modifiers={[
															restrictToVerticalAxis,
															restrictToParentElement,
														]}
														onDragEnd={(event) => {
															const { active, over } = event;
															if (over && active.id !== over?.id) {
																const activeIndex =
																	active.data.current?.sortable
																		?.index;
																const overIndex =
																	over.data.current?.sortable
																		?.index;
																if (
																	activeIndex !== undefined &&
																	overIndex !== undefined
																) {
																	move(activeIndex, overIndex);
																}
															}
														}}
													>
														<SortableContext
															items={elements}
															strategy={verticalListSortingStrategy}
														>
															{elements
																.filter((e) => !isButtonElement(e))
																.map((element, index) => (
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
																	></FormElement>
																))}
														</SortableContext>
													</DndContext>
												</div>
												<PanelWrapper sidebar={sidebarRef.current}>
													<FormItem>
														<PanelHeader state={panelState.state} />
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
				<div
					ref={sidebarRef}
					className="fixed right-0 top-[72px] z-30 flex h-[calc(100%-72px)] w-[380px] flex-col gap-10 overflow-auto border-l border-gray-200 bg-gray-50 p-4 pr-6 shadow"
				></div>
			</FormBuilderProvider>
		</TokenProvider>
	);
}
