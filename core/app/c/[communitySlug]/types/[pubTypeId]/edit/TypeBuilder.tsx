"use client"

import type { DragEndEvent } from "@dnd-kit/core"
import type { Static } from "@sinclair/typebox"
import type { NewPubFieldToPubType, PubFieldsId, PubTypesId } from "db/public"
import type { PanelState } from "~/app/components/FormBuilder/types"
import type { GetPubTypesResult } from "~/lib/server"

import React, { useCallback, useId, useMemo, useReducer, useRef } from "react"
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { typeboxResolver } from "@hookform/resolvers/typebox"
import { Type } from "@sinclair/typebox"
import { PlusCircle } from "lucide-react"
import { useFieldArray, useForm, useFormContext } from "react-hook-form"
import { IdString } from "schemas/utils"

import { CoreSchemaType } from "db/public"
import { logger } from "logger"
import { Button } from "ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel } from "ui/form"
import { useUnsavedChangesWarning } from "ui/hooks"
import { Input } from "ui/input"
import { usePubFieldContext } from "ui/pubFields"
import { toast } from "ui/use-toast"

import { BuilderProvider, useBuilder } from "~/app/components/FormBuilder/BuilderContext"
import { FieldIcon } from "~/app/components/FormBuilder/FieldIcon"
import { elementPanelReducer } from "~/app/components/FormBuilder/FormBuilder"
import { useIsChanged } from "~/app/components/FormBuilder/useIsChanged"
import { PanelHeader, PanelWrapper, SidePanel } from "~/app/components/SidePanel"
import { findRanksBetween, getRankAndIndexChanges } from "~/lib/rank"
import { didSucceed, useServerAction } from "~/lib/serverActions"
import { updatePubType } from "./actions"
import { FieldBlock } from "./FieldBlock"

/**
 * Only sends the dirty fields to the server
 */
const preparePayload = ({
	pubTypeId,
	formValues,
	defaultValues,
}: {
	pubTypeId: PubTypesId
	formValues: PubTypeBuilderSchema
	defaultValues: PubTypeBuilderSchema
}) => {
	const { upserts, deletes } = formValues.fields.reduce<{
		upserts: NewPubFieldToPubType[]
		deletes: PubFieldsId[]
	}>(
		(acc, field) => {
			if (field.deleted) {
				if (field.fieldId) {
					acc.deletes.push(field.fieldId)
				}
				return acc
			}

			if (!field.fieldId) {
				// Newly created elements have no elementId, so generate an id to use
				const id = crypto.randomUUID() as PubFieldsId
				acc.upserts.push({
					A: id,
					B: pubTypeId,
					rank: field.rank,
					isTitle: field.isTitle,
				})
				return acc
			}

			if (field.added) {
				acc.upserts.push({
					A: field.fieldId,
					B: pubTypeId,
					rank: field.rank,
					isTitle: field.isTitle,
				})
			}

			if (field.updated) {
				// check whether the element is reeeaally updated minus the updated field
				const { updated: _, id: _id, ...fieldWithoutUpdated } = field
				const { updated, id, ...rest } =
					defaultValues.fields.find((f) => f.fieldId === field.fieldId) ?? {}

				const defaultField = rest as Omit<
					PubTypeBuilderSchema["fields"][number],
					"updated" | "id"
				>

				if (JSON.stringify(defaultField) === JSON.stringify(fieldWithoutUpdated)) {
					return acc
				}

				acc.upserts.push({
					A: field.fieldId,
					B: pubTypeId,
					rank: field.rank,
					isTitle: field.isTitle,
				})
				return acc
			}
			return acc
		},
		{ upserts: [], deletes: [] }
	)

	return {
		upserts,
		deletes,
	}
}

export const pubTypeBuilderSchema = Type.Object({
	fields: Type.Array(
		Type.Object({
			id: Type.String(), // ignore this field
			fieldId: IdString<PubFieldsId>(),
			deleted: Type.Optional(Type.Boolean()),
			name: Type.String(),
			configured: Type.Optional(Type.Boolean()),
			added: Type.Optional(Type.Boolean()),
			updated: Type.Optional(Type.Boolean()),
			isRelation: Type.Boolean(),
			rank: Type.String(),
			slug: Type.String(),
			schemaName: Type.Enum(CoreSchemaType),
			isTitle: Type.Boolean(),
		})
	),
})

export type PubTypeBuilderSchema = Static<typeof pubTypeBuilderSchema>

export const TypeBuilder = ({
	pubType,
	formId,
}: {
	pubType: GetPubTypesResult[number]
	formId: string
}) => {
	const [isChanged, setIsChanged] = useIsChanged()

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
				isTitle: field.isTitle,
			})),
			name: pubType.name,
			description: pubType.description ?? undefined,
		}
	}, [pubType])

	const form = useForm<Static<typeof pubTypeBuilderSchema>>({
		resolver: typeboxResolver(pubTypeBuilderSchema),
		values: defaultValues,
	})

	const sidebarRef = useRef(null)
	const [panelState, dispatch] = useReducer(elementPanelReducer, {
		state: "initial",
		backButton: null,
		selectedElementIndex: null,
		fieldsFilter: null,
		buttonId: null,
	})

	const { append, fields, move, remove, update } = useFieldArray<
		Static<typeof pubTypeBuilderSchema>,
		"fields",
		"id"
	>({
		name: "fields",
		control: form.control,
	})

	const formValues = form.watch()

	useUnsavedChangesWarning(form.formState.isDirty)

	const payload = useMemo(
		() =>
			preparePayload({
				pubTypeId: pubType.id,
				formValues,
				defaultValues,
			}),
		[pubType.id, formValues, defaultValues]
	)

	React.useEffect(() => {
		setIsChanged(payload.upserts.length > 0 || payload.deletes.length > 0)
	}, [payload, setIsChanged])

	const runUpdatePubType = useServerAction(updatePubType)

	const onSubmit = async (formData: Static<typeof pubTypeBuilderSchema>) => {
		const result = await runUpdatePubType({
			pubTypeId: pubType.id,
			fields: formData.fields.map((field) => ({
				id: field.fieldId as PubFieldsId,
				rank: field.rank,
				deleted: field.deleted ?? false,
				isTitle: field.isTitle,
			})),
		})
		if (didSucceed(result)) {
			toast.success("Type saved")
		}
	}
	const addElement = useCallback(
		(element: Static<typeof pubTypeBuilderSchema>["fields"][number]) => {
			append(element)
		},
		[append]
	)
	const removeElement = useCallback(
		(index: number) => {
			const field = fields[index]
			if (field.fieldId) {
				update(index, { ...fields[index], deleted: true })
			} else {
				remove(index)
			}
		},
		[fields, update, remove]
	)
	const restoreElement = useCallback(
		(index: number) => update(index, { ...fields[index], deleted: false }),
		[fields, update]
	)
	const removeIfUnconfigured = useCallback(() => {
		if (panelState.selectedElementIndex === null || panelState.backButton !== "selecting") {
			return
		}
		const field = fields[panelState.selectedElementIndex]
		if (field.configured === false) {
			remove(panelState.selectedElementIndex)
		}
	}, [fields, remove, panelState.selectedElementIndex, panelState.backButton])

	// Update ranks and rhf field array position when elements are dragged
	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const changes = getRankAndIndexChanges(event, fields)
			if (changes) {
				// move doesn't trigger a rerender, so it's safe to chain these calls
				move(changes.activeIndex, changes.overIndex)
				update(changes.overIndex, {
					...fields[changes.activeIndex],
					rank: changes.rank,
					updated: true,
				})
			}
		},
		[
			fields, // move doesn't trigger a rerender, so it's safe to chain these calls
			move,
			update,
		]
	)

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	)

	const dndContextId = useId()

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
							id={formId}
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
														<FieldBlock
															isTitle={field.isTitle}
															toggleTitle={() => {
																update(index, {
																	...field,
																	isTitle: !field.isTitle,
																	updated: true,
																})
																// also update the current title field
																const currentTitleField =
																	fields.find((f) => f.isTitle)
																if (currentTitleField) {
																	update(
																		fields.indexOf(
																			currentTitleField
																		),
																		{
																			...currentTitleField,
																			isTitle: false,
																			updated: true,
																		}
																	)
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
	)
}

export const FieldPanel = ({ panelState }: { panelState: PanelState }) => {
	const {
		elementsCount,
		removeIfUnconfigured,
		dispatch,
		identity: id,
		selectedElement,
	} = useBuilder<Static<typeof pubTypeBuilderSchema>["fields"][number]>()

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
						aria-label="Add new field"
						data-testid="add-field-button"
					>
						<PlusCircle /> Add New
					</Button>
					<div className="mt-8">
						<FormLabel className="text-muted-foreground">ID</FormLabel>
						<hr className="my-2" />
						<Input disabled value={id} />
					</div>
				</div>
			)
		case "selecting":
			return <SelectField panelState={panelState} />
		case "editing": {
			if (panelState.selectedElementIndex === null) {
				return <div>No selected element</div>
			}

			if (!selectedElement) {
				return <div>No selected element</div>
			}

			// should never happen
			throw new Error(
				`Non-field and non-configuration input element selected in configuration form. This should never happen.`
			)
		}
	}
}

export const SelectField = ({ panelState }: { panelState: PanelState }) => {
	const fields = usePubFieldContext()

	const { elementsCount, dispatch, addElement } =
		useBuilder<Static<typeof pubTypeBuilderSchema>["fields"][number]>()
	const { getValues } = useFormContext<Static<typeof pubTypeBuilderSchema>>()
	const selectedFields = getValues().fields

	const fieldButtons = Object.values(fields).map((field) => {
		const usedFields = selectedFields.map((e) => e.fieldId)
		if (
			usedFields.includes(field.id) ||
			field.isArchived ||
			(panelState.fieldsFilter &&
				!`${field.name} ${field.slug} ${field.schemaName}`.includes(
					panelState.fieldsFilter
				))
		) {
			return null
		}

		const schemaName = field.schemaName
		if (schemaName === null) {
			return null
		}
		return (
			<Button
				type="button"
				variant="outline"
				key={field.id}
				className="flex h-[68px] flex-1 shrink-0 justify-start gap-4 bg-card p-4"
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
						isTitle: false,
					})
				}}
				data-testid={`field-button-${field.name}`}
			>
				<FieldIcon field={field} className="my-auto text-emerald-500" />
				<div className="flex flex-col items-start text-left">
					<div className="text-muted-foreground">{field.slug}</div>
					<div className="text-left font-semibold">{field.name}</div>
				</div>
			</Button>
		)
	})
	return (
		<div className="flex grow flex-col data-[state=inactive]:hidden">
			<Input
				type="search"
				placeholder="Type a field name to search..."
				aria-label="Type a field name to search"
				onChange={(event) => {
					dispatch({
						eventName: "filterFields",
						fieldsFilter: event.target.value,
					})
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
					dispatch({ eventName: "cancel" })
				}}
			>
				Cancel
			</Button>
		</div>
	)
}
