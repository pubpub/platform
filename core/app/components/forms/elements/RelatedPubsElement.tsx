"use client";

import type { FieldErrors } from "react-hook-form";

import { useMemo, useState } from "react";
import { Value } from "@sinclair/typebox/value";
import { useFieldArray, useFormContext } from "react-hook-form";
import { relationBlockConfigSchema } from "schemas";

import type { JsonValue } from "contracts";
import type { InputComponent, PubsId } from "db/public";
import { Button } from "ui/button";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Pencil, Plus, Trash, TriangleAlert } from "ui/icon";
import { MultiBlock } from "ui/multiblock";
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover";
import { cn } from "utils";

import type { PubFieldFormElementProps } from "../PubFieldFormElement";
import type { ElementProps } from "../types";
import type { GetPubsResult } from "~/lib/server";
import { AddRelatedPubsPanel } from "~/app/components/forms/AddRelatedPubsPanel";
import { getPubTitle } from "~/lib/pubs";
import { useContextEditorContext } from "../../ContextEditor/ContextEditorContext";
import { useFormElementToggleContext } from "../FormElementToggleContext";
import { PubFieldFormElement } from "../PubFieldFormElement";

const RelatedPubBlock = ({
	pub,
	onRemove,
	valueComponentProps,
	slug,
	onBlur,
}: {
	pub: GetPubsResult[number];
	onRemove: () => void;
	valueComponentProps: PubFieldFormElementProps;
	slug: string;
	onBlur?: () => void;
}) => {
	return (
		<div className="flex items-center justify-between rounded border border-l-[12px] border-l-emerald-100 p-3">
			{/* Max width to keep long 'value's truncated. 90% to leave room for the trash button */}
			<div className="flex max-w-[90%] flex-col items-start gap-1 text-sm">
				<span className="font-semibold">{getPubTitle(pub)}</span>
				<ConfigureRelatedValue {...valueComponentProps} slug={slug} onBlur={onBlur} />
			</div>
			<div>
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
		</div>
	);
};

type FieldValue = { value: JsonValue; relatedPubId: PubsId };
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
	const configLabel = "label" in element.config ? element.config.label : undefined;
	const label = configLabel || element.label || slug;

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

	const { fields, append, remove } = useFieldArray({ control, name: slug });

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
			{} as Record<string, GetPubsResult[number]>
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
					const handleAddPubs = (newPubs: GetPubsResult) => {
						const values = newPubs.map((p) => ({ relatedPubId: p.id, value: null }));
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
												{fields.map((item, index) => {
													const handleRemovePub = () => {
														remove(index);
													};
													const innerSlug =
														`${slug}.${index}.value` as const;
													return (
														<RelatedPubBlock
															key={item.id}
															pub={pubsById[item.relatedPubId]}
															onRemove={handleRemovePub}
															slug={innerSlug}
															valueComponentProps={
																valueComponentProps
															}
															onBlur={field.onBlur}
														/>
													);
												})}
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
