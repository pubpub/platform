"use client";

import type { ReactNode } from "react";

import { useMemo, useState } from "react";
import { Value } from "@sinclair/typebox/value";
import { useFieldArray, useFormContext } from "react-hook-form";
import { relationBlockConfigSchema } from "schemas";

import type { JsonValue } from "contracts";
import type { InputComponent, PubsId } from "db/public";
import { Button } from "ui/button";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Plus, Trash } from "ui/icon";
import { MultiBlock } from "ui/multiblock";
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover";

import type { PubFieldFormElementProps } from "../PubFieldFormElement";
import type { ElementProps } from "../types";
import type { GetPubsResult } from "~/lib/server";
import { AddRelatedPubsPanel } from "~/app/components/forms/AddRelatedPubsPanel";
import { useContextEditorContext } from "../../ContextEditor/ContextEditorContext";
import { useFormElementToggleContext } from "../FormElementToggleContext";
import { PubFieldFormElement } from "../PubFieldFormElement";

const RelatedPubBlock = ({
	pub,
	onRemove,
	valueComponentProps,
	slug,
}: {
	pub: Pick<GetPubsResult[number], "title" | "id">;
	onRemove: () => void;
	valueComponentProps: PubFieldFormElementProps;
	slug: string;
}) => {
	const { title, id } = pub;

	return (
		<div className="flex items-center justify-between rounded border border-l-[12px] border-l-emerald-100 p-3">
			<div className="flex flex-col items-start gap-1 text-sm">
				<span className="font-semibold">{title || id}</span>
				<ConfigureRelatedValue {...valueComponentProps} slug={slug} />
			</div>
			<div>
				<Button
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

export const ConfigureRelatedValue = ({
	slug,
	element,
	...props
}: PubFieldFormElementProps & { slug: string }) => {
	const configLabel = "label" in element.config ? element.config.label : undefined;
	const label = configLabel || element.label || slug;

	const { watch } = useFormContext();
	const [isPopoverOpen, setPopoverIsOpen] = useState(false);
	const value = watch(slug);
	const showValue = value != null && value !== "" && !isPopoverOpen;

	if (element.component === null) {
		return null;
	}

	return showValue ? (
		// TODO: this should be more sophisticated for the more complex fields
		value.toString()
	) : (
		<Popover open={isPopoverOpen} onOpenChange={setPopoverIsOpen}>
			<PopoverTrigger asChild>
				<Button
					data-testid="add-related-value"
					variant="link"
					size="sm"
					className="flex h-4 gap-1 p-0 text-blue-500"
				>
					Add {label} <Plus size={12} />
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
													const innerSlug = `${slug}.${index}.value`;
													return (
														<RelatedPubBlock
															key={item.id}
															pub={pubsById[item.relatedPubId]}
															onRemove={handleRemovePub}
															slug={innerSlug}
															valueComponentProps={
																valueComponentProps
															}
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
