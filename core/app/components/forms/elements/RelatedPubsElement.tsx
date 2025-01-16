"use client";

import type { ReactNode } from "react";

import { useState } from "react";
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

	const linkablePubs = pubs
		.filter((p) =>
			config.relationshipConfig.pubType
				? p.pubTypeId === config.relationshipConfig.pubType
				: true
		)
		// do not allow linking to itself. TODO: do not show already linked pubs
		.filter((p) => p.id !== pubId);

	const handleAddPubs = (newPubs: GetPubsResult) => {
		console.log({ newPubs });
	};

	return (
		<>
			<FormField
				control={control}
				name={slug}
				render={({ field }) => {
					return (
						<FormItem>
							<FormLabel className="flex">{label}</FormLabel>
							<div className="flex items-end gap-x-2">
								<FormControl>
									<MultiBlock
										title="Pub Relations"
										disabled={!isEnabled}
										onAdd={() => setShowPanel(true)}
									></MultiBlock>
								</FormControl>
							</div>
							<FormDescription>{config.relationshipConfig.help}</FormDescription>
							<FormMessage />
						</FormItem>
					);
				}}
			/>
			{showPanel && (
				<AddRelatedPubsPanel
					title={`Add ${label}`}
					onCancel={() => setShowPanel(false)}
					pubs={linkablePubs}
					onAdd={handleAddPubs}
				/>
			)}
		</>
	);
};
