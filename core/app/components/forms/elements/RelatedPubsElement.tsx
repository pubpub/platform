"use client";

import type { DragEndEvent } from "@dnd-kit/core";
import type { FieldErrors } from "react-hook-form";

import { useCallback, useMemo, useState } from "react";
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Value } from "@sinclair/typebox/value";
import mudder from "mudder";
import { useFieldArray, useFormContext } from "react-hook-form";
import { relationBlockConfigSchema } from "schemas";

import type { JsonValue } from "contracts";
import type { InputComponent, PubsId } from "db/public";
import { Button } from "ui/button";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { GripVertical, Pencil, Plus, Trash, TriangleAlert } from "ui/icon";
import { MultiBlock } from "ui/multiblock";
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover";
import { cn } from "utils";

import type { ContextEditorPub } from "../../ContextEditor/ContextEditorContext";
import type { PubFieldFormElementProps } from "../PubFieldFormElement";
import type { ElementProps } from "../types";
import { AddRelatedPubsPanel } from "~/app/components/forms/AddRelatedPubsPanel";
import { getPubTitle } from "~/lib/pubs";
import { useContextEditorContext } from "../../ContextEditor/ContextEditorContext";
import { useFormElementToggleContext } from "../FormElementToggleContext";
import { PubFieldFormElement } from "../PubFieldFormElement";

const RelatedPubBlock = ({
	id,
	pub,
	onRemove,
	valueComponentProps,
	slug,
	onBlur,
}: {
	id: string;
	pub: ContextEditorPub;
	onRemove: () => void;
	valueComponentProps: PubFieldFormElementProps;
	slug: string;
	onBlur?: () => void;
}) => {
	const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
		id,
	});

	const style = {
		transform: CSS.Translate.toString(transform),
		transition,
	};
	return (
		<div
			ref={setNodeRef}
			style={style}
			className="flex items-center justify-start rounded border border-l-[12px] border-l-emerald-100 p-3"
		>
			{/* Max width to keep long 'value's truncated. 90% to leave room for the trash button */}
			<div className="flex max-w-[90%] flex-col items-start gap-1 text-sm">
				<span className="font-semibold">{getPubTitle(pub)}</span>
				<ConfigureRelatedValue {...valueComponentProps} slug={slug} onBlur={onBlur} />
			</div>
			<div className="ml-auto">
				<Button
					type="button"
					variant="ghost"
					className="p-2 text-neutral-400 hover:bg-white hover:text-red-500"
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
	);
};

type FieldValue = { value: JsonValue; relatedPubId: PubsId; rank: string };
type FormValue = {
	[slug: string]: FieldValue[];
};
type FormValueSingle = {
	[slug: string]: JsonValue;
};

const parseRelatedPubValuesSlugError = (
	slug: string,
	formStateErrors: FieldErrors<FormValueSingle> | FieldErrors<FormValue>
) => {
	const [baseSlug, index] = slug.split(".");
	const indexNumber = index ? parseInt(index) : undefined;

	if (!indexNumber || isNaN(indexNumber)) {
		const baseError = (formStateErrors as FieldErrors<FormValueSingle>)[baseSlug];
		return baseError;
	}
	const valueError = (formStateErrors as FieldErrors<FormValue>)[baseSlug]?.[indexNumber]?.value;
	return valueError;
};

export const ConfigureRelatedValue = ({
	slug,
	element,
	onBlur,
	className,
	...props
}: PubFieldFormElementProps & {
	slug: string;
	onBlur?: () => void;
	className?: string;
}) => {
	const configLabel =
		"relationshipConfig" in element.config
			? element.config.relationshipConfig.label
			: element.config.label;
	const label = configLabel || element.label || element.slug;

	const { watch, formState } = useFormContext<FormValue | FormValueSingle>();
	const [isPopoverOpen, setPopoverIsOpen] = useState(false);
	const value = watch(slug);
	const showValue = value != null && value !== "";

	const valueError = parseRelatedPubValuesSlugError(slug, formState.errors);

	if (element.component === null) {
		return null;
	}

	return (
		<Popover
			open={isPopoverOpen}
			onOpenChange={(open) => {
				if (!open && onBlur) {
					// In order to retrigger validation
					onBlur();
				}
				setPopoverIsOpen(open);
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
							"text-red-500": valueError,
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
	);
};

export const RelatedPubsElement = ({
	slug,
	label,
	config,
	valueComponentProps,
}: ElementProps<InputComponent.relationBlock> & {
	valueComponentProps: PubFieldFormElementProps;
}) => {
	const { pubs, pubId } = useContextEditorContext();
	const [showPanel, setShowPanel] = useState(false);
	const { control } = useFormContext<FormValue>();
	const formElementToggle = useFormElementToggleContext();
	const isEnabled = formElementToggle.isEnabled(slug);

	const { fields, append, remove, move, update } = useFieldArray({ control, name: slug });

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	// Update ranks and rhf field array position when elements are dragged
	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const { active, over } = event;
			if (over && active.id !== over?.id) {
				// activeIndex is the position the element started at and over is where it was
				// dropped
				const activeIndex = active.data.current?.sortable?.index;
				const overIndex = over.data.current?.sortable?.index;
				if (activeIndex !== undefined && overIndex !== undefined) {
					// "earlier" means towards the beginning of the list, or towards the top of the page
					const isMovedEarlier = activeIndex > overIndex;
					const activeElem = fields[activeIndex];

					// When moving an element earlier in the array, find a rank between the rank of the
					// element at the dropped position and the element before it. When moving an element
					// later, instead find a rank between that element and the element after it
					const aboveRank =
						fields[isMovedEarlier ? overIndex : overIndex + 1]?.rank ?? "";
					const belowRank =
						fields[isMovedEarlier ? overIndex - 1 : overIndex]?.rank ?? "";
					const [rank] = mudder.base62.mudder(belowRank, aboveRank, 1);

					// move doesn't trigger a rerender, so it's safe to chain these calls
					move(activeIndex, overIndex);
					update(overIndex, {
						...activeElem,
						rank,
					});
				}
			}
		},
		[fields]
	);

	Value.Default(relationBlockConfigSchema, config);
	if (!Value.Check(relationBlockConfigSchema, config)) {
		return null;
	}

	const pubsById = useMemo(() => {
		return pubs.reduce(
			(acc, pub) => {
				acc[pub.id] = pub;
				return acc;
			},
			{} as Record<string, ContextEditorPub>
		);
	}, [pubs]);

	const linkedPubs = fields.map((f) => f.relatedPubId);
	const linkablePubs = pubs
		// do not allow linking to itself or any pubs it is already linked to
		.filter((p) => p.id !== pubId && !linkedPubs.includes(p.id));

	return (
		<>
			<FormField
				control={control}
				name={slug}
				render={({ field }) => {
					const handleAddPubs = (newPubs: ContextEditorPub[]) => {
						const ranks = mudder.base62.mudder(
							field.value[field.value.length - 1]?.rank,
							"",
							newPubs.length
						);
						const values = newPubs.map((p, i) => ({
							relatedPubId: p.id,
							value: null,
							rank: ranks[i],
						}));
						for (const value of values) {
							append(value);
						}
					};

					return (
						<FormItem data-testid={`related-pubs-${label}`}>
							{showPanel && (
								<AddRelatedPubsPanel
									title={`Add ${label}`}
									onCancel={() => setShowPanel(false)}
									pubs={linkablePubs}
									onAdd={handleAddPubs}
								/>
							)}
							<FormLabel className="flex">{label}</FormLabel>
							<div className="flex items-end gap-x-2">
								<FormControl>
									<MultiBlock
										title="Pub Relations"
										disabled={!isEnabled}
										onAdd={() => setShowPanel(true)}
									>
										{fields.length ? (
											<div className="flex flex-col gap-2">
												<DndContext
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
														{fields.map((item, index) => {
															const handleRemovePub = () => {
																remove(index);
															};
															const innerSlug =
																`${slug}.${index}.value` as const;
															return (
																<RelatedPubBlock
																	key={item.id}
																	id={item.id}
																	pub={
																		pubsById[item.relatedPubId]
																	}
																	onRemove={handleRemovePub}
																	slug={innerSlug}
																	valueComponentProps={
																		valueComponentProps
																	}
																	onBlur={field.onBlur}
																/>
															);
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
						</FormItem>
					);
				}}
			/>
		</>
	);
};
