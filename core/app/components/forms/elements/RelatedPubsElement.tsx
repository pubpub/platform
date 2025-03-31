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
import { skipToken } from "@tanstack/react-query";
import { useFieldArray, useFormContext } from "react-hook-form";
import { relationBlockConfigSchema } from "schemas";

import type { ProcessedPub } from "contracts";
import type { InputComponent, PubsId } from "db/public";
import { Button } from "ui/button";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { GripVertical, Pencil, Plus, Trash, TriangleAlert } from "ui/icon";
import { MultiBlock } from "ui/multiblock";
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover";
import { cn } from "utils";

import type { PubFieldFormElementProps } from "../PubFieldFormElement";
import type { ElementProps, RelatedFormValues, SingleFormValues } from "../types";
import { AddRelatedPubsPanel } from "~/app/components/forms/AddRelatedPubsPanel";
import { getPubTitle } from "~/lib/pubs";
import { findRanksBetween, getRankAndIndexChanges } from "~/lib/rank";
import { useFormElementToggleContext } from "../FormElementToggleContext";
import { PubFieldFormElement } from "../PubFieldFormElement";

const RelatedPubBlock = ({
	id,
	pubTitle,
	onRemove,
	valueComponentProps,
	slug,
	onBlur,
}: {
	id: string;
	pubTitle: string;
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
				<span className="font-semibold">{pubTitle}</span>
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

const parseRelatedPubValuesSlugError = (
	slug: string,
	formStateErrors: FieldErrors<SingleFormValues> | FieldErrors<RelatedFormValues>
) => {
	const [baseSlug, index] = slug.split(".");
	const indexNumber = index ? parseInt(index) : undefined;

	if (!indexNumber || isNaN(indexNumber)) {
		const baseError = (formStateErrors as FieldErrors<SingleFormValues>)[baseSlug];
		return baseError;
	}
	const valueError = (formStateErrors as FieldErrors<RelatedFormValues>)[baseSlug]?.[indexNumber]
		?.value;
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

	const { watch, formState } = useFormContext<RelatedFormValues | SingleFormValues>();
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
	const [showPanel, setShowPanel] = useState(false);
	const initialRelatedPubs = valueComponentProps.values.flatMap((v) =>
		v.relatedPub && v.relatedPubId
			? [{ id: v.relatedPubId, pub: v.relatedPub as ProcessedPub<{ withPubType: true }> }]
			: []
	);
	const initialRelatedPubTitles = Object.fromEntries(
		initialRelatedPubs.map((p) => [p.id, getPubTitle(p.pub)])
	);

	const [pubTitles, setPubTitles] = useState<Record<PubsId, string>>(initialRelatedPubTitles);

	const { control, getValues, setValue } = useFormContext<
		RelatedFormValues & { deleted: { slug: string; relatedPubId: PubsId }[] }
	>();
	const formElementToggle = useFormElementToggleContext();
	const isEnabled = formElementToggle.isEnabled(slug);

	const { fields, append, move, update, remove } = useFieldArray({ control, name: slug });

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	// Update ranks and rhf field array position when elements are dragged
	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const changes = getRankAndIndexChanges(event, fields);
			if (changes) {
				// move doesn't trigger a rerender, so it's safe to chain these calls
				move(changes.activeIndex, changes.overIndex);
				const { id, ...movedField } = fields[changes.activeIndex];
				update(changes.overIndex, {
					...movedField,
					rank: changes.rank,
				});
			}
		},
		[fields]
	);

	Value.Default(relationBlockConfigSchema, config);
	if (!Value.Check(relationBlockConfigSchema, config)) {
		return null;
	}

	return (
		<>
			<FormField
				control={control}
				name={slug}
				render={({ field }) => {
					const handleAddPubs = (newPubs: ProcessedPub<{ withPubType: true }>[]) => {
						// Only add the pubs that we do not already have
						const alreadyLinked = field.value.map((v) => v.relatedPubId);
						const ranks = findRanksBetween({
							start: field.value[field.value.length - 1]?.rank,
							numberOfRanks: newPubs.length,
						});
						const values = newPubs
							.filter((p) => !alreadyLinked.includes(p.id))
							.map((p, i) => ({
								relatedPubId: p.id,
								value: null,
								rank: ranks[i],
							}));
						for (const value of values) {
							append(value);
						}
						const newPubTitles = Object.fromEntries(
							newPubs.map((p) => [p.id, getPubTitle(p)])
						);
						setPubTitles({ ...pubTitles, ...newPubTitles });
					};

					return (
						<FormItem data-testid={`related-pubs-${label}`}>
							{showPanel && (
								<AddRelatedPubsPanel
									title={`Add ${label}`}
									onCancel={() => setShowPanel(false)}
									onAdd={handleAddPubs}
									relatedPubs={initialRelatedPubs.map((rp) => rp.pub)}
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
														{fields.map(({ id, ...item }, index) => {
															const handleRemovePub = () => {
																remove(index);
																if (item.valueId) {
																	setValue("deleted", [
																		...getValues("deleted"),
																		{
																			relatedPubId:
																				item.relatedPubId,
																			slug,
																		},
																	]);
																}
															};
															const innerSlug =
																`${slug}.${index}.value` as const;
															return (
																<RelatedPubBlock
																	key={id}
																	id={id}
																	pubTitle={
																		pubTitles[item.relatedPubId]
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
