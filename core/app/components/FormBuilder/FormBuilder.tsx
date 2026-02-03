"use client"

import type { DragEndEvent } from "@dnd-kit/core"
import type { ProcessedPub } from "contracts"
import type {
	FormElementsId,
	NewFormElements,
	NewFormElementToPubType,
	PubFieldsId,
	PubTypesId,
	Stages,
} from "db/public"
import type { Form as PubForm, SimpleForm } from "~/lib/server/form"
import type { BasicFormElements } from "../forms/types"
import type { FormBuilderSchema, FormElementData, PanelEvent, PanelState } from "./types"

import * as React from "react"
import { useCallback, useMemo, useReducer, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { zodResolver } from "@hookform/resolvers/zod"
import { type UseFormReturn, useFieldArray, useForm } from "react-hook-form"

import { formElementsInitializerSchema } from "db/public"
import { logger } from "logger"
import { Button } from "ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "ui/form"
import { useUnsavedChangesWarning } from "ui/hooks"
import { BookOpen, Menu, Settings, TriangleAlert } from "ui/icon"
import { Input } from "ui/input"
import { usePubFieldContext } from "ui/pubFields"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "ui/sheet"
import { Skeleton } from "ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs"
import { TokenProvider } from "ui/tokens"
import { toast } from "ui/use-toast"

import { PubSearchSelect } from "~/app/components/pubs/PubSearchSelect"
import { getRankAndIndexChanges } from "~/lib/rank"
import { renderWithPubTokens } from "~/lib/server/render/pub/renderWithPubTokens"
import { didSucceed, useServerAction } from "~/lib/serverActions"
import { isPubFieldElement } from "../forms/types"
import { PanelHeader, PanelWrapper, SidePanel } from "../SidePanel"
import { saveForm } from "./actions"
import { BuilderProvider } from "./BuilderContext"
import { ElementPanel } from "./ElementPanel"
import { SelectAccess } from "./ElementPanel/SelectAccess"
import { FormElement } from "./FormElement"
import { formBuilderSchema, isButtonElement } from "./types"
import { useIsChanged } from "./useIsChanged"

export const elementPanelReducer: React.Reducer<PanelState, PanelEvent> = (prevState, event) => {
	const { eventName } = event
	switch (eventName) {
		case "filterFields": {
			const { fieldsFilter } = event
			return { ...prevState, fieldsFilter }
		}
		case "cancel":
			return {
				state: "initial",
				selectedElementIndex: null,
				fieldsFilter: null,
				backButton: null,
				buttonId: null,
			}
		case "back":
			return {
				state: prevState.backButton ?? "initial",
				backButton: prevState.backButton === "selecting" ? "initial" : null,
				selectedElementIndex: null,
				fieldsFilter: null,
				buttonId: null,
			}
		case "add":
			if (prevState.state === "initial")
				return {
					...prevState,
					state: "selecting",
					fieldsFilter: null,
					backButton: "initial",
				}
			break
		case "edit": {
			const newBack = prevState.state === "editing" ? prevState.backButton : prevState.state
			return {
				state: "editing",
				backButton: newBack,
				selectedElementIndex: event.selectedElementIndex,
				fieldsFilter: null,
				buttonId: null,
			}
		}
		case "save":
			if (prevState.state === "editing")
				return { ...prevState, state: "initial", selectedElementIndex: null }
			if (prevState.state === "editingButton")
				return { ...prevState, state: "initial", buttonId: null }
			break
		case "editButton": {
			const buttonId = event.buttonId ?? null
			return {
				...prevState,
				state: "editingButton",
				backButton: "initial",
				buttonId,
			}
		}
	}
	return prevState
}

const elementPanelTitles: Record<PanelState["state"], string> = {
	editing: "Configure element",
	selecting: "Add element",
	initial: "Elements",
	editingButton: "Edit Submission Button",
}

type Props = {
	pubForm: PubForm
	id: string
	stages: Stages[]
	pubTypeId: PubTypesId
	currentDefaultForm?: SimpleForm
}

const FormPreview = dynamic(() => import("./FormPreview").then((mod) => mod.FormPreview), {
	ssr: false,
	loading: () => <Skeleton className="h-96 w-full" />,
})

type SidebarTab = "elements" | "preview" | "settings"

/**
 * Only sends the dirty fields to the server
 */
const preparePayload = ({
	formValues,
	defaultValues,
}: {
	defaultValues: FormBuilderSchema
	formValues: FormBuilderSchema
}) => {
	const { upserts, deletes, relatedPubTypes, deletedRelatedPubTypes } =
		formValues.elements.reduce<{
			upserts: NewFormElements[]
			deletes: FormElementsId[]
			relatedPubTypes: NewFormElementToPubType[]
			deletedRelatedPubTypes: FormElementsId[]
		}>(
			(acc, element, _index) => {
				if (element.deleted) {
					if (element.elementId) {
						acc.deletes.push(element.elementId)
					}
				} else if (!element.elementId) {
					// Newly created elements have no elementId, so generate an id to use
					const id = crypto.randomUUID() as FormElementsId
					acc.upserts.push(
						formElementsInitializerSchema.parse({
							formId: formValues.formId,
							...element,
							id,
						})
					)
					if (element.relatedPubTypes) {
						for (const pubTypeId of element.relatedPubTypes) {
							acc.relatedPubTypes.push({ A: id, B: pubTypeId })
						}
					}
				} else if (element.updated) {
					// check whether the element is reeeaally updated minus the updated field
					const { updated: _, id: _id, ...elementWithoutUpdated } = element
					const {
						updated: _updated,
						id: _elemId,
						...rest
					} = defaultValues.elements.find((e) => e.elementId === element.elementId) ?? {}

					const defaultElement = rest as Omit<FormElementData, "updated" | "id">

					if (JSON.stringify(defaultElement) === JSON.stringify(elementWithoutUpdated)) {
						return acc
					}

					acc.upserts.push(
						formElementsInitializerSchema.parse({
							...element,
							formId: formValues.formId,
							id: element.elementId,
						})
					) // TODO: only update changed columns
					if (element.relatedPubTypes) {
						// If we are updating to an empty array and there were related pub types before, we should clear out all related pub types
						if (
							element.relatedPubTypes.length === 0 &&
							defaultElement.relatedPubTypes?.length
						) {
							acc.deletedRelatedPubTypes.push(element.elementId)
						} else {
							for (const pubTypeId of element.relatedPubTypes) {
								acc.relatedPubTypes.push({ A: element.elementId, B: pubTypeId })
							}
						}
					}
				}
				return acc
			},
			{ upserts: [], deletes: [], relatedPubTypes: [], deletedRelatedPubTypes: [] }
		)

	const access = formValues.access !== defaultValues.access ? formValues.access : undefined

	return {
		formId: formValues.formId,
		name: formValues.name !== defaultValues.name ? formValues.name : undefined,
		isDefault:
			formValues.isDefault !== defaultValues.isDefault ? formValues.isDefault : undefined,
		upserts,
		deletes,
		access,
		relatedPubTypes,
		deletedRelatedPubTypes,
	}
}

export function FormBuilder({ pubForm, id, stages, pubTypeId, currentDefaultForm }: Props) {
	const [isChanged, setIsChanged] = useIsChanged()
	const [sidebarTab, setSidebarTab] = useState<SidebarTab>("elements")
	const [selectedPub, setSelectedPub] = useState<
		| ProcessedPub<{
				withPubType: true
				withStage: true
				withValues: true
				withRelatedPubs: true
		  }>
		| undefined
	>()
	const [mobileSheetOpen, setMobileSheetOpen] = useState(false)

	const defaultValues = useMemo(() => {
		return {
			elements: pubForm.elements.map((e) => {
				// do not include extra fields here
				const { slug: _slug, id, fieldName: _fieldName, ...rest } = e
				// rename id to avoid conflict with rhf generated id
				return { ...rest, elementId: id }
			}),
			access: pubForm.access,
			name: pubForm.name,
			formId: pubForm.id,
			isDefault: pubForm.isDefault,
		}
	}, [pubForm])

	const form = useForm<FormBuilderSchema>({
		resolver: zodResolver(formBuilderSchema),

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

	const {
		append,
		fields: elements,
		move,
		remove,
		update,
	} = useFieldArray({
		name: "elements",
		control: form.control,
	})

	const formValues = form.getValues()

	useUnsavedChangesWarning(isChanged)

	const payload = useMemo(
		() => preparePayload({ formValues, defaultValues }),
		[formValues, defaultValues]
	)

	React.useEffect(() => {
		setIsChanged(
			payload.upserts.length > 0 ||
				payload.deletes.length > 0 ||
				payload.access != null ||
				payload.name != null ||
				payload.isDefault != null
		)
	}, [payload, setIsChanged])

	const runSaveForm = useServerAction(saveForm)

	const onSubmit = async (_formData: FormBuilderSchema) => {
		const result = await runSaveForm(payload)
		if (didSucceed(result)) {
			toast.success("Form saved")
		}
	}
	const addElement = useCallback(
		(element: FormElementData) => {
			append({ ...element, added: true })
		},
		[append]
	)
	const removeElement = useCallback(
		(index: number) => {
			const element = elements[index]
			if (element.elementId) {
				update(index, { ...elements[index], deleted: true })
			} else {
				remove(index)
			}
		},
		[elements, update, remove]
	)
	const restoreElement = useCallback(
		(index: number) => update(index, { ...elements[index], deleted: false }),
		[elements, update]
	)
	const removeIfUnconfigured = useCallback(() => {
		if (panelState.selectedElementIndex === null || panelState.backButton !== "selecting") {
			return
		}
		const element = elements[panelState.selectedElementIndex]
		if (element.configured === false) {
			remove(panelState.selectedElementIndex)
		}
	}, [elements, remove, panelState.selectedElementIndex, panelState.backButton])

	// Update ranks and rhf field array position when elements are dragged
	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const changes = getRankAndIndexChanges(event, elements)
			if (changes) {
				// move doesn't trigger a rerender, so it's safe to chain these calls
				move(changes.activeIndex, changes.overIndex)
				update(changes.overIndex, {
					...elements[changes.activeIndex],
					rank: changes.rank,
					updated: true,
				})
			}
		},
		[
			elements, // move doesn't trigger a rerender, so it's safe to chain these calls
			move,
			update,
		]
	)

	const tokens = { content: renderWithPubTokens }

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	)

	const dndContextId = React.useId()

	const pubFields = usePubFieldContext()
	const elementsWithPubFields = useMemo(() => {
		return elements.map((e) => {
			const el = e as unknown as BasicFormElements
			if (!isPubFieldElement(el)) {
				return e
			}

			const field = pubFields[el.fieldId as PubFieldsId]
			if (!field) {
				return e
			}

			return {
				...e,
				slug: field.slug,
				fieldName: field.name,
			}
		}) as FormElementData[]
	}, [elements, pubFields])

	const previewForm = useMemo(() => {
		return {
			...pubForm,
			elements: elementsWithPubFields.filter((e) => !isButtonElement(e)),
		} as PubForm
	}, [pubForm, elementsWithPubFields])

	const sidebarContent = (
		<Tabs
			value={sidebarTab}
			onValueChange={(v) => setSidebarTab(v as SidebarTab)}
			className="flex h-full flex-col"
		>
			<TabsList className="mx-4 grid grid-cols-3 md:mx-2">
				<TabsTrigger
					value="elements"
					className="text-xs"
					data-testid="form-builder-tab-elements"
				>
					<Settings className="mr-1 h-3 w-3" />
					Elements
				</TabsTrigger>
				<TabsTrigger
					value="preview"
					className="text-xs"
					data-testid="form-builder-tab-preview"
				>
					<BookOpen className="mr-1 h-3 w-3" />
					Preview
				</TabsTrigger>
				<TabsTrigger
					value="settings"
					className="text-xs"
					data-testid="form-builder-tab-settings"
				>
					<Menu className="mr-1 h-3 w-3" />
					Settings
				</TabsTrigger>
			</TabsList>

			<TabsContent value="elements" className="mt-4 flex-1 overflow-auto p-4 md:p-2">
				<FormItem className="relative flex h-full flex-col">
					<PanelHeader
						title={elementPanelTitles[panelState.state]}
						showCancel={!(panelState.state === "initial")}
						onCancel={() => dispatch({ eventName: "cancel" })}
					/>
					<FormControl>
						<ElementPanel panelState={panelState} />
					</FormControl>
				</FormItem>
			</TabsContent>

			<TabsContent value="preview" className="mt-4 flex-1 overflow-auto">
				<div className="flex flex-col gap-4 p-4 md:p-2">
					<div>
						<FormLabel className="text-muted-foreground text-xs uppercase">
							Test with Pub
						</FormLabel>
						<hr className="my-2" />
						<PubSearchSelect
							withValues
							withRelatedPubs
							onSelectedPubsChange={(pubs) => {
								if (!pubs.length) {
									setSelectedPub(undefined)
									return
								}
								setSelectedPub(pubs[0])
							}}
							placeholder="Select a Pub to preview with..."
							pubTypeIds={[pubTypeId]}
						/>
						<p className="mt-2 text-muted-foreground text-xs">
							Select a Pub to preview the form with real values and interpolated
							content.
						</p>
					</div>
					<FormPreview
						form={previewForm}
						selectedPub={selectedPub}
						// IMPORTANT: key is used to force a re-render when the selected pub changes, otherwise the values will not be updated
						key={selectedPub?.id}
					/>
				</div>
			</TabsContent>

			<TabsContent value="settings" className="mt-4 flex-1 overflow-auto p-4 md:p-2">
				<FormSettingsPanel
					form={form}
					currentDefaultForm={currentDefaultForm}
					slug={pubForm.slug}
				/>
			</TabsContent>
		</Tabs>
	)

	return (
		<TokenProvider tokens={tokens}>
			<BuilderProvider
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
				identity={pubForm.slug}
				stages={stages}
				isDirty={isChanged}
			>
				<div className="md:pr-[420px]">
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
										{/* mobile header/sidebar toggle */}
										<div className="mt-4 mb-2 flex items-center justify-between md:hidden">
											<h2 className="font-medium text-lg">Form Builder</h2>
											<Sheet
												open={mobileSheetOpen}
												onOpenChange={setMobileSheetOpen}
											>
												<SheetTrigger asChild>
													<Button variant="outline" size="sm">
														<Menu className="mr-2 h-4 w-4" />
														Settings
													</Button>
												</SheetTrigger>
												<SheetContent
													side="right"
													className="w-full overflow-auto sm:max-w-md"
												>
													<SheetHeader>
														<SheetTitle>Form Settings</SheetTitle>
													</SheetHeader>
													{sidebarContent}
												</SheetContent>
											</Sheet>
										</div>
										<ol className="flex flex-col items-center justify-center gap-4 overflow-y-auto">
											<DndContext
												modifiers={[
													restrictToVerticalAxis,
													restrictToParentElement,
												]}
												onDragEnd={handleDragEnd}
												sensors={sensors}
												id={dndContextId}
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
											{sidebarContent}
										</PanelWrapper>
									</>
								)}
							/>
						</form>
					</Form>
				</div>
				<SidePanel ref={sidebarRef} className="hidden md:flex md:w-[420px]" />
			</BuilderProvider>
		</TokenProvider>
	)
}

type FormSettingsPanelProps = {
	form: UseFormReturn<FormBuilderSchema>
	currentDefaultForm?: SimpleForm
	slug: string
}

const FormSettingsPanel = ({ form, currentDefaultForm, slug }: FormSettingsPanelProps) => {
	return (
		<div className="flex flex-col gap-6">
			<FormField
				control={form.control}
				name="name"
				render={({ field }) => (
					<FormItem>
						<FormLabel className="text-muted-foreground text-xs uppercase">
							Form Name
						</FormLabel>
						<hr className="my-2" />
						<Input {...field} placeholder="Form name" />
						<FormMessage />
					</FormItem>
				)}
			/>

			<div>
				<FormLabel className="text-muted-foreground text-xs uppercase">Slug</FormLabel>
				<hr className="my-2" />
				<Input disabled value={slug} />
			</div>

			<SelectAccess />

			<FormField
				control={form.control}
				name="isDefault"
				render={({ field }) => (
					<FormItem>
						<FormLabel className="text-muted-foreground text-xs uppercase">
							Default Form
						</FormLabel>
						<hr className="my-2" />
						{field.value ? (
							<div className="rounded-md border border-green-200 bg-green-50 p-3">
								<p className="font-medium text-green-800 text-sm">
									This is the default form for this Pub Type
								</p>
								<p className="mt-1 text-green-700 text-xs">
									This form is used as the default internal editor for all Pubs of
									this type.
								</p>
							</div>
						) : (
							<div className="flex flex-col gap-3">
								{currentDefaultForm && (
									<div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3">
										<TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
										<div>
											<p className="font-medium text-amber-800 text-sm">
												Current default: {currentDefaultForm.name}
											</p>
											<p className="mt-1 text-amber-700 text-xs">
												Setting this form as default will replace the
												current default form.
											</p>
										</div>
									</div>
								)}
								<Button
									type="button"
									variant="outline"
									onClick={() => field.onChange(!field.value)}
									className="w-full"
								>
									{field.value ? "Remove as Default Form" : "Set as Default Form"}
								</Button>
							</div>
						)}
						<FormMessage />
					</FormItem>
				)}
			/>
		</div>
	)
}
