"use client";

import * as React from "react";
import { useCallback, useReducer, useState } from "react";
import { DndContext } from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";

import { FormAccessType } from "db/public";
import { logger } from "logger";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "ui/form";
import { CircleCheck } from "ui/icon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";
import { toast } from "ui/use-toast";

import type { FormBuilderSchema, FormElementData, PanelEvent, PanelState } from "./types";
import type { Form as PubForm } from "~/lib/server/form";
import { didSucceed, useServerAction } from "~/lib/serverActions";
import { saveForm } from "./actions";
import { ElementPanel } from "./ElementPanel";
import { FormBuilderProvider } from "./FormBuilderContext";
import { FormElement } from "./FormElement";
import { formBuilderSchema } from "./types";

const elementPanelReducer: React.Reducer<PanelState, PanelEvent> = (state, event) => {
	switch (event) {
		case "cancel":
			return "initial";
			break;
		case "back":
			if (state === "configuring") return "selecting";
			break;
		case "add":
			if (state === "initial") return "selecting";
		case "configure":
			return "configuring";
			break;
		case "save":
			if (state === "configuring") return "initial";
			break;
	}
	return state;
};

const elementPanelTitles: Record<PanelState, string> = {
	configuring: "Configure element",
	selecting: "Add element",
	initial: "Elements",
};

type Props = {
	pubForm: PubForm;
	id: string;
};

export function FormBuilder({ pubForm, id }: Props) {
	const form = useForm<FormBuilderSchema>({
		resolver: zodResolver(formBuilderSchema),
		values: {
			elements: pubForm.elements,
			access: pubForm.access,
			formId: pubForm.id,
		},
	});

	const [panelState, dispatch] = useReducer(elementPanelReducer, "initial");
	const [editingElementIndex, setEditingElementIndex] = useState<null | number>(null);

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
				children: (
					<div className="flex gap-3">
						<CircleCheck />
						<span>Form Successfully Saved</span>
					</div>
				),
			});
		}
	};
	const addElement = useCallback((element: FormElementData) => {
		append(element);
	}, []);
	const removeElement = useCallback(
		(index: number) => update(index, { ...elements[index], deleted: true }),
		[]
	);
	const restoreElement = useCallback(
		(index: number) => update(index, { ...elements[index], deleted: false }),
		[]
	);
	const setEditingElement = useCallback(
		(index: number | null) => setEditingElementIndex(index),
		[]
	);

	return (
		<FormBuilderProvider
			addElement={addElement}
			removeElement={removeElement}
			restoreElement={restoreElement}
			setEditingElement={setEditingElement}
			editingElement={
				editingElementIndex !== null ? elements[editingElementIndex] : undefined
			}
			elementsCount={elements.length}
			openConfigPanel={() => dispatch("configure")}
			update={update}
		>
			{" "}
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
								onSubmit={form.handleSubmit(onSubmit, (errors) =>
									logger.debug({ msg: "unable to submit form", errors })
								)}
							>
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
													active.data.current?.sortable?.index;
												const overIndex =
													over.data.current?.sortable?.index;
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
											{elements.map((element, index) => {
												return (
													<FormElement
														key={element.id}
														element={element}
														index={index}
														isEditing={editingElementIndex === index}
														isDisabled={
															editingElementIndex !== null &&
															editingElementIndex !== index
														}
													></FormElement>
												);
											})}
										</SortableContext>
									</DndContext>
								</div>
								<div className="fixed right-0 top-[72px] z-30 flex h-screen w-[380px] flex-col gap-10 border-l border-gray-200 bg-gray-50 p-4 pr-6 shadow">
									<FormField
										control={form.control}
										name="elements"
										render={() => (
											<FormItem>
												<FormLabel className="mb-4 uppercase text-slate-500">
													{elementPanelTitles[panelState]}
												</FormLabel>
												<hr />
												<FormControl>
													<ElementPanel
														state={panelState}
														dispatch={dispatch}
													/>
												</FormControl>
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="access"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-slate-500">
													Access
												</FormLabel>
												<hr />
												<Select
													onValueChange={field.onChange}
													defaultValue={field.value}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="Select a type" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{Object.values(FormAccessType).map((t) => (
															<SelectItem
																key={t}
																value={t.toString()}
															>
																<div className="first-letter:capitalize">
																	{t}
																</div>
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<FormDescription>
													{field.value === FormAccessType.private &&
														"Only internal editors can submit"}{" "}
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</form>
						</Form>
					</TabsContent>
					<TabsContent value="preview">Preview your form here</TabsContent>
				</div>
			</Tabs>
		</FormBuilderProvider>
	);
}
