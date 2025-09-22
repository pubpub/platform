"use client";

import type { ControllerRenderProps, FieldValues } from "react-hook-form";

import React from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";

import { FormControl, FormField, FormItem, FormLabel } from "../form";
import { useStages } from "./StagesProvider";

type Props = {
	// fieldLabel: string;
	field: ControllerRenderProps<FieldValues, string>;
	label: string;
};

/**
 * Mostly meant for use in AutoForm, use {@link StagesSelectField} instead
 */
export const StagesSelect = (props: Props) => {
	const stages = useStages();
	return (
		<FormItem className="flex flex-col gap-y-1">
			<div className="flex items-center justify-between">
				<FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
					{props.label}
				</FormLabel>
			</div>
			<Select
				{...props.field}
				onValueChange={(value) => {
					props.field.onChange(value);
				}}
				defaultValue={props.field.value}
			>
				<FormControl>
					<SelectTrigger>
						<SelectValue placeholder="Select a stage" />
					</SelectTrigger>
				</FormControl>
				<SelectContent>
					{stages.map((stage) => (
						<SelectItem key={stage.id} value={stage.id}>
							{stage.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</FormItem>
	);
};

/**
 * Use this instead of the StagesSelect component when you want to use the StagesSelect in a form directly
 */
export const StagesSelectField = (props: { fieldName: string; fieldLabel: string }) => {
	return (
		<FormField
			name={props.fieldName}
			render={({ field }) => <StagesSelect field={field} label={props.fieldLabel} />}
		/>
	);
};
