"use client";

import type { SchemaComponentData } from "schemas/src/CoreSchemaWithIcons";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { SCHEMA_TYPES_WITH_ICONS } from "schemas";
import { z } from "zod";

import { Button } from "ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "ui/form";
import { Input } from "ui/input";
import { Switch } from "ui/switch";

import { useFormBuilder } from "../FormBuilderContext";
import { isFieldInput } from "../types";

const ComponentSelect = ({ components }: { components: SchemaComponentData[] }) => {
	return <></>;
};

type Props = {
	index: number;
};

export const InputElementConfigurationForm = ({ index }: Props) => {
	const { selectedElement, update, dispatch, removeIfUnconfigured } = useFormBuilder();
	if (!selectedElement || !isFieldInput(selectedElement)) {
		return null;
	}

	const schema = z.object({
		label: z.string().default(""),
		placeholder: z.string().default(""),
		help: z.string().default(""),
		required: z.boolean().default(true),
	});

	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: schema.parse(selectedElement),
	});

	const onSubmit = (values: z.infer<typeof schema>) => {
		update(index, { ...selectedElement, ...values, updated: true, configured: true });
		dispatch({ eventName: "save" });
	};

	const { components } = SCHEMA_TYPES_WITH_ICONS[selectedElement.schemaName];

	return (
		<Form {...form}>
			<form
				onSubmit={(e) => {
					e.stopPropagation(); //prevent submission from propagating to parent form
					form.handleSubmit(onSubmit)(e);
				}}
				className="flex h-full flex-col gap-2 pt-2"
			>
				{Array.isArray(components) && <ComponentSelect components={components} />}
				<FormField
					control={form.control}
					name="label"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Label</FormLabel>
							<FormControl>
								<Input {...field} placeholder="Tells the user what to input" />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="placeholder"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Placeholder</FormLabel>
							<FormControl>
								<Input
									{...field}
									placeholder="Temporary text hinting at expected input"
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="help"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Help Text</FormLabel>
							<FormControl>
								<Input {...field} placeholder="Optional additional guidance" />
							</FormControl>
							<FormDescription>Appears below the field</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="required"
					render={({ field }) => (
						<FormItem>
							<FormControl>
								<Switch
									className="data-[state=checked]:bg-emerald-400"
									checked={field.value}
									onCheckedChange={field.onChange}
								/>
							</FormControl>
							<FormLabel>Mark as required</FormLabel>
							<FormMessage />
						</FormItem>
					)}
				/>
				<div className="flex w-full">
					<Button
						type="button"
						className="border-slate-950"
						variant="outline"
						onClick={() => {
							removeIfUnconfigured();
							dispatch({ eventName: "cancel" });
						}}
					>
						Cancel
					</Button>
					<Button type="submit" className="bg-blue-500 hover:bg-blue-600">
						Add
					</Button>
				</div>
			</form>
		</Form>
	);
};
