"use client";

import type { ReactNode } from "react";

import { useMemo, useState } from "react";
import { Value } from "@sinclair/typebox/value";
import { useFormContext } from "react-hook-form";
import { relationBlockConfigSchema } from "schemas";

import type { InputComponent } from "db/public";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { MultiBlock } from "ui/multiblock";

import type { ElementProps } from "../types";
import type { GetPubsResult } from "~/lib/server";
import { AddRelatedPubsPanel } from "~/app/components/forms/AddRelatedPubsPanel";
import { useContextEditorContext } from "../../ContextEditor/ContextEditorContext";
import { useFormElementToggleContext } from "../FormElementToggleContext";

export const RelatedPubsElement = ({
	slug,
	label,
	config,
}: ElementProps<InputComponent.relationBlock> & { valueComponent: ReactNode }) => {
	const { pubs, pubId } = useContextEditorContext();
	const [showPanel, setShowPanel] = useState(false);
	const { control } = useFormContext();
	const formElementToggle = useFormElementToggleContext();
	const isEnabled = formElementToggle.isEnabled(slug);

	Value.Default(relationBlockConfigSchema, config);
	if (!Value.Check(relationBlockConfigSchema, config)) {
		return null;
	}

	const pubTitlesById = useMemo(() => {
		return pubs.reduce(
			(acc, { id, title }) => {
				acc[id] = title;
				return acc;
			},
			{} as Record<string, string | null>
		);
	}, [pubs]);

	return (
		<>
			<FormField
				control={control}
				name={slug}
				render={({ field }) => {
					const linkedPubs = Array.isArray(field.value)
						? field.value.map((v) => v.relatedPubId)
						: [];
					const linkablePubs = pubs
						// do not allow linking to itself or any pubs it is already linked to
						.filter((p) => p.id !== pubId && !linkedPubs.includes(p.id));

					const handleAddPubs = (newPubs: GetPubsResult) => {
						// todo: make value an actual thing
						const value = newPubs.map((p) => ({ relatedPubId: p.id, value: "" }));
						if (Array.isArray(field.value)) {
							field.onChange([...field.value, ...value]);
						} else {
							field.onChange(value);
						}
					};
					return (
						<FormItem>
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
										{Array.isArray(field.value)
											? field.value.map((pub: any) => {
													return (
														<div key={pub.relatedPubId}>
															{pubTitlesById[pub.relatedPubId]}
														</div>
													);
												})
											: null}
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
