"use client"

import type { InputComponent, PubsId, PubValuesId } from "db/public"
import type { FieldErrors } from "react-hook-form"
import type { PubCardClientPub } from "~/app/components/pubs/PubCard/PubCardClient"
import type { PubFieldFormElementProps } from "../PubFieldFormElement"
import type {
	ElementProps,
	PubFieldElement,
	PubFieldElementComponent,
	RelatedFormValues,
	SingleFormValues,
} from "../types"

import { useCallback, useId, useMemo, useState } from "react"
import {
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core"
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Value } from "@sinclair/typebox/value"
import { AlertTriangle } from "lucide-react"
import { useFieldArray, useFormContext } from "react-hook-form"
import { relationBlockConfigSchema } from "schemas"

import { MemberRole } from "db/public"
import { Button } from "ui/button"
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form"
import { GripVertical, Pencil, Plus, Trash, TriangleAlert } from "ui/icon"
import { MultiBlock } from "ui/multiblock"
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover"
import { cn } from "utils"

import { AddRelatedPubsPanel } from "~/app/components/forms/AddRelatedPubsPanel"
import { getPubTitle } from "~/lib/pubs"
import { findRanksBetween, getRankAndIndexChanges } from "~/lib/rank"
import { useContextEditorContext } from "../../ContextEditor/ContextEditorContext"
import { usePubForm } from "../../providers/PubFormProvider"
import { useCommunityMembershipOrThrow } from "../../providers/UserProvider"
import { useFormElementToggleContext } from "../FormElementToggleContext"
import { PubFieldFormElement } from "../PubFieldFormElement"

const RelatedPubBlock = ({
	id,
	pubTitle,
	onRemove,
	valueComponentProps,
	slug,
	onBlur,
}: {
	id: string
	pubTitle: string
	onRemove: () => void
	valueComponentProps: PubFieldFormElementProps
	slug: string
	onBlur?: () => void
}) => {
	const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
		id,
	})

	const style = {
		transform: CSS.Translate.toString(transform),
		transition,
	}

	return (
		<div
			ref={setNodeRef}
			style={style}
			className="flex items-center justify-start rounded-sm border border-l-12 border-l-emerald-100 p-3"
		>
			{/* Max width to keep long 'value's truncated. 90% to leave room for the trash button */}
			<div className="flex max-w-[90%] flex-col items-start gap-1 text-sm">
				<span className="font-semibold">{pubTitle}</span>
				<ConfigureRelatedValue {...valueComponentProps} slug={slug} onBlur={onBlur} />
			</div>
			<div className="ml-auto">
				<Button
					type="button"
					variant="ghost"
					className="p-2 text-neutral-400 hover:bg-white hover:text-destructive"
					aria-label="Delete link to related pub"
					onClick={onRemove}
				>
					<Trash size={24} />
				</Button>
			</div>
			<div>
				<Button
					type="button"
					aria-label="Drag handle"
					variant="ghost"
					className="p-2"
					{...listeners}
					{...attributes}
				>
					<GripVertical size={24} className="text-neutral-400" />
				</Button>
			</div>
		</div>
	)
}

const parseRelatedPubValuesSlugError = (
	slug: string,
	formStateErrors: FieldErrors<SingleFormValues> | FieldErrors<RelatedFormValues>
) => {
	const [baseSlug, index] = slug.split(".")
	const indexNumber = index ? parseInt(index, 10) : undefined

	if (!indexNumber || Number.isNaN(indexNumber)) {
		const baseError = (formStateErrors as FieldErrors<SingleFormValues>)[baseSlug]
		return baseError
	}
	const valueError = (formStateErrors as FieldErrors<RelatedFormValues>)[baseSlug]?.[indexNumber]
		?.value
	return valueError
}

export const ConfigureRelatedValue = ({
	slug,
	element,
	onBlur,
	className,
	...props
}: PubFieldFormElementProps & {
	slug: string
	onBlur?: () => void
	className?: string
}) => {
	const configLabel =
		element.isRelation && "relationshipConfig" in element.config
			? element.config.relationshipConfig.label
			: element.config.label
	const label = configLabel || element.label || element.slug

	const { watch, formState } = useFormContext<RelatedFormValues | SingleFormValues>()
	const [isPopoverOpen, setPopoverIsOpen] = useState(false)
	const value = watch(slug)
	const showValue = value != null && value !== ""

	const valueError = parseRelatedPubValuesSlugError(slug, formState.errors)

	if (element.component === null) {
		return null
	}

	return (
		<Popover
			open={isPopoverOpen}
			onOpenChange={(open) => {
				if (!open && onBlur) {
					// In order to retrigger validation
					onBlur()
				}
				setPopoverIsOpen(open)
			}}
		>
			<PopoverTrigger asChild>
				<Button
					type="button"
					data-testid="add-related-value"
					variant="link"
					size="sm"
					className={cn(
						"flex h-4 max-w-full gap-1 p-0 text-blue-500",
						{
							"text-destructive": valueError,
						},
						className
					)}
				>
					{valueError && <TriangleAlert />}
					<span className="truncate">
						{/* TODO: value display should be more sophisticated for the more complex fields */}
						{showValue ? value.toString() : `Add ${label}`}
					</span>
					{showValue ? <Pencil size={12} /> : <Plus size={12} />}
				</Button>
			</PopoverTrigger>
			<PopoverContent side="bottom">
				<PubFieldFormElement {...props} element={element} slug={slug} label={label} />
			</PopoverContent>
		</Popover>
	)
}

const useShouldShowRelationBlockWarning = (
	element: PubFieldElement<PubFieldElementComponent, true>
) => {
	const membership = useCommunityMembershipOrThrow()
	const { relatedPubTypes } = element
	return relatedPubTypes.length === 0 && membership.role === MemberRole.admin
}

export const RelatedPubsElement = ({
	slug,
	label,
	config,
	valueComponentProps,
}: ElementProps<InputComponent.relationBlock> & {
	valueComponentProps: PubFieldFormElementProps<PubFieldElementComponent, true>
}) => {
	const { pubId, element } = valueComponentProps
	const { pubTypes } = useContextEditorContext()
	const { form, mode } = usePubForm()
	const { relatedPubTypes: relatedPubTypeIds } = element
	const relatedPubTypes = pubTypes.filter((pt) => relatedPubTypeIds?.includes(pt.id))

	const [showPanel, setShowPanel] = useState(false)

	// Look through existing related pubs in `values` to get their pub titles
	const initialRelatedPubs = valueComponentProps.values.flatMap((v) =>
		v.relatedPub && v.relatedPubId
			? [
					{
						id: v.relatedPubId,
						pub: v.relatedPub as PubCardClientPub,
					},
				]
			: []
	)
	// Keep track of related pubs in state, as we either have 'full' pubs from the initial values,
	// or from the table when they are added
	const [relatedPubs, setRelatedPubs] = useState<PubCardClientPub[]>(
		initialRelatedPubs.map((p) => p.pub)
	)

	const pubTitles = useMemo(() => {
		return Object.fromEntries(relatedPubs.map((p) => [p.id, getPubTitle(p)]))
	}, [relatedPubs])

	const { control, getValues, setValue } = useFormContext<
		RelatedFormValues & { deleted: { slug: string; relatedPubId: PubsId }[] }
	>()
	const formElementToggle = useFormElementToggleContext()
	const _isEnabled = formElementToggle.isEnabled(slug)

	const { fields, append, move, update, remove } = useFieldArray({
		control,
		name: slug,
	})

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	)

	const id = useId()

	// Update ranks and rhf field array position when elements are dragged
	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const changes = getRankAndIndexChanges(event, fields)
			if (changes) {
				// move doesn't trigger a rerender, so it's safe to chain these calls
				move(changes.activeIndex, changes.overIndex)
				const { id, ...movedField } = fields[changes.activeIndex]
				update(changes.overIndex, {
					...movedField,
					rank: changes.rank,
				})
			}
		},
		[
			fields, // move doesn't trigger a rerender, so it's safe to chain these calls
			move,
			update,
		]
	)

	const showRelationBlockWarning = useShouldShowRelationBlockWarning(element)

	Value.Default(relationBlockConfigSchema, config)
	if (!Value.Check(relationBlockConfigSchema, config)) {
		return null
	}

	return (
		<FormField
			control={control}
			name={slug}
			render={({ field }) => {
				const handleRemovePub = (
					item: { valueId?: PubValuesId; relatedPubId: PubsId },
					index: number
				) => {
					remove(index)
					if (item.valueId) {
						setValue("deleted", [
							...getValues("deleted"),
							{
								relatedPubId: item.relatedPubId,
								slug,
							},
						])
					}
					setRelatedPubs(relatedPubs.filter((p) => p.id !== item.relatedPubId))
				}

				const handleChangeRelatedPubs = (newPubs: PubCardClientPub[]) => {
					for (const [index, value] of field.value.entries()) {
						const removed = !newPubs.find((p) => p.id === value.relatedPubId)
						if (removed) {
							handleRemovePub(value, index)
						}
					}

					// Only add the pubs that we do not already have
					const alreadyLinked = field.value.map((v) => v.relatedPubId)
					const ranks = findRanksBetween({
						start: field.value[field.value.length - 1]?.rank,
						numberOfRanks: newPubs.length,
					})
					// Add new values
					const newlyAdded = newPubs.filter((p) => !alreadyLinked.includes(p.id))
					const newValues = newlyAdded.map((p, i) => ({
						relatedPubId: p.id,
						value: null,
						rank: ranks[i],
					}))
					for (const value of newValues) {
						append(value)
					}
					setRelatedPubs([...relatedPubs, ...newlyAdded])
				}

				return (
					<FormItem
						data-testid={`related-pubs-${label}`}
						// otherwise it jumps down when the panel is open
						className="flex flex-col gap-y-2 space-y-0"
					>
						{showPanel && (
							<AddRelatedPubsPanel
								title={`Add ${label}`}
								onCancel={() => setShowPanel(false)}
								onChangeRelatedPubs={handleChangeRelatedPubs}
								relatedPubs={relatedPubs}
								// Do not allow linking to itself
								disabledPubs={pubId ? [pubId] : undefined}
								pubTypes={relatedPubTypes}
								fieldSlug={slug}
								currentPubId={mode === "edit" ? pubId : undefined}
								formSlug={form.slug}
							/>
						)}
						<FormLabel className="flex">{label}</FormLabel>
						<div className="flex items-end gap-x-2">
							<FormControl>
								<MultiBlock
									title="Pub Relations"
									disabled={!_isEnabled}
									onAdd={() => setShowPanel(true)}
								>
									{fields.length ? (
										<div className="flex flex-col gap-2">
											<DndContext
												id={id}
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
													{fields.map(({ id, ...item }, index) => {
														const innerSlug =
															`${slug}.${index}.value` as const
														return (
															<RelatedPubBlock
																key={id}
																id={id}
																pubTitle={
																	pubTitles[item.relatedPubId]
																}
																onRemove={() =>
																	handleRemovePub(item, index)
																}
																slug={innerSlug}
																valueComponentProps={
																	valueComponentProps
																}
																onBlur={field.onBlur}
															/>
														)
													})}
												</SortableContext>
											</DndContext>
										</div>
									) : null}
								</MultiBlock>
							</FormControl>
						</div>

						<FormDescription>{config.relationshipConfig.help}</FormDescription>
						<FormMessage />
						{showRelationBlockWarning && (
							<div className="flex items-center gap-2 text-amber-500 text-xs">
								<AlertTriangle size={16} /> No related Pub Types have been
								configured, so users will not be able to link to this pub. <br />
								Only admins can see this warning.
							</div>
						)}
					</FormItem>
				)
			}}
		/>
	)
}
