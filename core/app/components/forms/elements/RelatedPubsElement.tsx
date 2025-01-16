"use client";

import type { ReactNode } from "react";

import { Value } from "@sinclair/typebox/value";
import { useFormContext } from "react-hook-form";
import { relationBlockConfigSchema } from "schemas";

import type { InputComponent } from "db/public";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { MultiBlock } from "ui/multiblock";

import type { ElementProps } from "../types";
import { useFormElementToggleContext } from "../FormElementToggleContext";

export const RelatedPubsElement = ({
	slug,
	label,
	config,
}: ElementProps<InputComponent.relationBlock> & { valueComponent: ReactNode }) => {
	const { control } = useFormContext();
	const formElementToggle = useFormElementToggleContext();
	const isEnabled = formElementToggle.isEnabled(slug);

	Value.Default(relationBlockConfigSchema, config);
	if (!Value.Check(relationBlockConfigSchema, config)) {
		return null;
	}

	return (
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
								></MultiBlock>
							</FormControl>
						</div>
						<FormDescription>{config.relationshipConfig.help}</FormDescription>
						<FormMessage />
					</FormItem>
				);
			}}
		/>
	);
};
