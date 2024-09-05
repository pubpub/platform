"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { componentConfigSchemas, componentsBySchema } from "schemas";
import { z } from "zod";

import { InputComponent } from "db/src/public/InputComponent";
import { Button } from "ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardTitle } from "ui/card";
import { Checkbox } from "ui/checkbox";
import { Confidence } from "ui/customRenderers/confidence/confidence";
import { FileUpload } from "ui/customRenderers/fileUpload/fileUpload";
import { DatePicker } from "ui/date-picker";
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
import { RadioGroup, RadioGroupCard } from "ui/radio-group";
import { Switch } from "ui/switch";
import { Textarea } from "ui/textarea";

import { useFormBuilder } from "../FormBuilderContext";
import { FieldInputElement } from "../FormElement";
import { isFieldInput } from "../types";

type SchemaComponentData = {
	name?: string;
	placeholder?: string;
	Component?: JSX.Element;
};

const componentInfo: Record<InputComponent, SchemaComponentData> = {
	[InputComponent.textArea]: {
		name: "Textarea",
		Component: <Textarea disabled placeholder="For long text" />,
	},
	[InputComponent.textInput]: {
		name: "Input",
		placeholder: "For short text",
		Component: <Input disabled placeholder="For short text" />,
	},
	[InputComponent.checkbox]: { name: "Checkbox", Component: <Checkbox checked /> },
	[InputComponent.datePicker]: {
		name: "Date picker",
		Component: <DatePicker setDate={() => {}} />,
	},
	[InputComponent.fileUpload]: {
		name: "File Upload",
		Component: <FileUpload upload={() => {}} onUpdateFiles={() => {}} disabled />,
	},
	[InputComponent.memberSelect]: { name: "Member select" },
	[InputComponent.confidenceInterval]: { name: "Combo Slider", Component: <Confidence /> },
} as const;

const ComponentSelect = ({
	components,
	onChange,
}: {
	components: InputComponent[];
	onChange: (component: InputComponent) => void;
}) => {
	return (
		<RadioGroup
			className="grid grid-cols-2 gap-3"
			defaultValue={components[0]}
			onValueChange={onChange}
		>
			{components.map((c) => {
				const { name, Component } = componentInfo[c];
				return (
					<RadioGroupCard key={c} value={c} className="w-full max-w-sm">
						<CardContent className="grid gap-4">{Component}</CardContent>
						<hr />
						<CardFooter>
							<CardDescription>{name}</CardDescription>
						</CardFooter>
					</RadioGroupCard>
				);
			})}
		</RadioGroup>
	);
};

type Props = {
	index: number;
};

export const InputElementConfigurationForm = ({ index }: Props) => {
	const { selectedElement, update, dispatch, removeIfUnconfigured } = useFormBuilder();
	if (!selectedElement || !isFieldInput(selectedElement)) {
		return null;
	}
	console.log("selected element schema", selectedElement.schemaName);
	const components = componentsBySchema[selectedElement.schemaName];
	// const configSchema = componentConfigSchemas[selectedElement.schemaName]

	const schema = z.object({
		label: z.string().nullable().default(""),
		required: z.boolean().nullable(),
		component: z.nativeEnum(InputComponent).refine((c) => components.includes(c)),
		//config: configSchema,
	});

	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: schema.parse(selectedElement),
	});

	const onSubmit = (values: z.infer<typeof schema>) => {
		update(index, { ...selectedElement, ...values, updated: true, configured: true });
		dispatch({ eventName: "save" });
	};

	return (
		<Form {...form}>
			<form
				onSubmit={(e) => {
					e.stopPropagation(); //prevent submission from propagating to parent form
					form.handleSubmit(onSubmit)(e);
				}}
				className="flex h-full flex-col gap-2"
			>
				<div className="flex flex-nowrap rounded border border-l-[12px] border-solid border-gray-200 border-l-emerald-100 bg-white p-3 pr-4">
					<FieldInputElement element={selectedElement} isEditing={false} />
				</div>
				<div className="text-sm uppercase text-muted-foreground">Appearance</div>
				<hr />
				<ComponentSelect
					onChange={(component) => form.setValue("component", component)}
					components={components}
				/>
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
				{/* TODO: Autoform style rendering of componentConfig  */}
				<hr className="mt-4" />
				<FormField
					control={form.control}
					name="required"
					render={({ field }) => (
						<FormItem className="mb-3 mt-1 flex items-center">
							<FormControl>
								<Switch
									className="mr-2 data-[state=checked]:bg-emerald-400"
									checked={field.value ?? undefined}
									onCheckedChange={field.onChange}
								/>
							</FormControl>
							<FormLabel className="!mt-0">Mark as required</FormLabel>
							<FormMessage />
						</FormItem>
					)}
				/>
				<div className="grid grid-cols-2 gap-2">
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
						Save
					</Button>
				</div>
			</form>
		</Form>
	);
};
