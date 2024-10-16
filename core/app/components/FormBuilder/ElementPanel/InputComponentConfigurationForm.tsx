"use client";

import type { TSchema } from "@sinclair/typebox";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { typeboxResolver } from "@hookform/resolvers/typebox";
import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { useForm } from "react-hook-form";
import { componentConfigSchemas, componentsBySchema } from "schemas";

import { CoreSchemaType, InputComponent } from "db/public";
import { Button } from "ui/button";
import { Checkbox } from "ui/checkbox";
import { Confidence } from "ui/customRenderers/confidence/confidence";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { useUnsavedChangesWarning } from "ui/hooks";
import { ImagePlus } from "ui/icon";
import { Input } from "ui/input";
import { Label } from "ui/label";
import { RadioGroup, RadioGroupItem } from "ui/radio-group";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "ui/select";
import { Skeleton } from "ui/skeleton";
import { Switch } from "ui/switch";
import { Textarea } from "ui/textarea";

import type { InputElement } from "../types";
import type { ConfigFormData } from "./ComponentConfig/types";
import { useFormBuilder } from "../FormBuilderContext";
import { FieldInputElement } from "../FormElement";
import { isFieldInput } from "../types";
import { ComponentConfig } from "./ComponentConfig";

type SchemaComponentData = {
	name?: string;
	placeholder?: string;
	demoComponent?: (props: { element: InputElement }) => JSX.Element;
};

const DatePicker = dynamic(() => import("ui/date-picker").then((mod) => mod.DatePicker), {
	ssr: false,
	loading: () => <Skeleton className="h-9 w-full" />,
});

const componentInfo: Record<InputComponent, SchemaComponentData> = {
	[InputComponent.textArea]: {
		name: "Textarea",
		demoComponent: () => <Textarea placeholder="For long text" />,
	},
	[InputComponent.textInput]: {
		name: "Input",
		placeholder: "For short text",
		demoComponent: ({ element }) => (
			<Input
				placeholder={
					element.schemaName === CoreSchemaType.String ? "For short text" : "For numbers"
				}
				type={element.schemaName === CoreSchemaType.String ? "text" : "number"}
			/>
		),
	},
	[InputComponent.checkbox]: { name: "Checkbox", demoComponent: () => <Checkbox checked /> },
	[InputComponent.datePicker]: {
		name: "Date picker",
		demoComponent: () => <DatePicker setDate={() => {}} />,
	},
	[InputComponent.fileUpload]: {
		name: "File Upload",
		demoComponent: () => <ImagePlus size={30} />,
	},
	[InputComponent.memberSelect]: { name: "Member select" },
	[InputComponent.confidenceInterval]: {
		name: "Combo Slider",
		demoComponent: () => <Confidence value={[0, 50, 100]} min={0} max={100} />,
	},
	[InputComponent.checkboxGroup]: {
		name: "Checkbox Group",
		demoComponent: () => (
			<div className="flex h-full w-full flex-col items-start justify-between gap-1 text-left text-sm text-gray-500">
				<div>Label</div>
				<div className="flex items-center gap-1">
					<Checkbox id="c1" />
					<Label className="font-normal" htmlFor="c1">
						Checkbox 1 value
					</Label>
				</div>
				<div className="flex items-center gap-1">
					<Checkbox id="c2" />
					<Label className="font-normal" htmlFor="c2">
						Checkbox 2 value
					</Label>
				</div>
			</div>
		),
	},
	[InputComponent.radioGroup]: {
		name: "Radio Group",
		demoComponent: () => (
			<RadioGroup className="w-full text-left text-sm text-gray-500">
				<div>Label</div>
				<div className="flex items-center gap-1">
					<RadioGroupItem value="1" id="r1" />
					<Label className="font-normal" htmlFor="r1">
						Radio 1 value
					</Label>
				</div>
				<div className="flex items-center gap-1">
					<RadioGroupItem value="2" id="r2" />
					<Label className="font-normal" htmlFor="r2">
						Radio 2 value
					</Label>
				</div>
			</RadioGroup>
		),
	},
	[InputComponent.selectDropdown]: {
		name: "Select Dropdown",
		demoComponent: () => (
			<div className="flex flex-col gap-1 text-left text-sm text-gray-500">
				<div>Label</div>
				<Select>
					<SelectTrigger className="text-left">
						<SelectValue placeholder="Select an option" />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup className="text-left">
							<SelectItem value="1">Select 1 value</SelectItem>
							<SelectItem value="2">Select 2 value</SelectItem>
						</SelectGroup>
					</SelectContent>
				</Select>
			</div>
		),
	},
} as const;

const ComponentSelect = ({
	components,
	onChange,
	value,
	element,
}: {
	components: InputComponent[];
	value: InputComponent;
	onChange: (component: InputComponent) => void;
	element: InputElement;
}) => {
	return (
		<div className="grid grid-cols-2 gap-3">
			{components.map((c) => {
				const { name, demoComponent: Component } = componentInfo[c];
				const selected = value === c;
				return (
					<div key={c}>
						{/* We use regular input instead of a RadioGroup here because the RadioGroup
						renders buttons, and we cannot render buttons inside of buttons. Some of the demo components
						need to render buttons. */}
						<input
							id={`component-${c}`}
							name="component"
							type="radio"
							className="peer sr-only"
							defaultChecked={selected}
							onChange={() => {
								onChange(c);
							}}
						/>
						<div className="flex h-[124px] w-full flex-col justify-between rounded-lg border bg-card text-card-foreground shadow-sm peer-checked:border-2 peer-checked:border-ring peer-checked:outline-none">
							<label className="cursor-pointer" htmlFor={`component-${c}`}>
								<div
									// 'inert' allows demo components to not be interactive unless they are selected
									// @ts-ignore inert isn't typed properly in React 18, but will be in 19
									inert={selected ? undefined : ""}
									className="flex h-[88px] w-full items-center justify-center p-3"
								>
									{Component && <Component element={element} />}
								</div>
								<hr className="w-full" />
								<div className="w-full py-2 text-center text-sm text-foreground">
									{name}
								</div>
							</label>
						</div>
					</div>
				);
			})}
		</div>
	);
};

const Nullable = <T extends TSchema>(schema: T) => Type.Union([schema, Type.Null()]);

type Props = {
	index: number;
};

export const InputComponentConfigurationForm = ({ index }: Props) => {
	const { selectedElement, update, dispatch, removeIfUnconfigured } = useFormBuilder();
	if (!selectedElement || !isFieldInput(selectedElement)) {
		return null;
	}
	const { schemaName } = selectedElement;
	const allowedComponents = componentsBySchema[schemaName];

	const form = useForm<ConfigFormData<(typeof allowedComponents)[number]>>({
		// Dynamically set the resolver so that the schema can update based on the selected component
		resolver: (values, context, options) => {
			const schema = Type.Object({
				required: Nullable(Type.Boolean({ default: true })),
				component: Type.Enum(InputComponent),
				config: componentConfigSchemas[values.component],
			});
			const createResolver = typeboxResolver(schema);
			return createResolver(values, context, options);
		},
		defaultValues: selectedElement,
	});

	useUnsavedChangesWarning(form.formState.isDirty);

	const component = form.watch("component");

	const onSubmit = (values: ConfigFormData<typeof component>) => {
		// Some `config` schemas have extra values which persist if we don't Clean first
		const cleanedConfig = Value.Clean(componentConfigSchemas[values.component], values.config);
		update(index, {
			...selectedElement,
			...values,
			config: cleanedConfig,
			updated: true,
			configured: true,
		});
		dispatch({ eventName: "save" });
	};
	const configForm = useMemo(
		() => <ComponentConfig schemaName={schemaName} form={form} component={component} />,
		[component, schemaName]
	);
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
				<FormField
					control={form.control}
					name="component"
					render={({ field }) => (
						<ComponentSelect
							onChange={field.onChange}
							value={field.value}
							element={selectedElement}
							components={allowedComponents}
						/>
					)}
				/>
				{configForm}
				<hr className="mt-4" />
				{component !== InputComponent.checkbox && (
					<FormField
						control={form.control}
						name="required"
						render={({ field }) => (
							<FormItem className="mb-auto mt-1 flex items-center">
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
				)}
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
					<Button
						type="submit"
						className="bg-blue-500 hover:bg-blue-600"
						disabled={!form.formState.isDirty}
					>
						Save
					</Button>
				</div>
			</form>
		</Form>
	);
};
