"use client";

import type { TSchema } from "@sinclair/typebox";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { typeboxResolver } from "@hookform/resolvers/typebox";
import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { useForm } from "react-hook-form";
import { componentConfigSchemas, componentsBySchema, relationBlockConfigSchema } from "schemas";

import type { PubsId, PubTypesId } from "db/public";
import { CoreSchemaType, InputComponent } from "db/public";
import { Button } from "ui/button";
import { Checkbox } from "ui/checkbox";
import { Confidence } from "ui/customRenderers/confidence/confidence";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { useUnsavedChangesWarning } from "ui/hooks";
import { ImagePlus } from "ui/icon";
import { Input } from "ui/input";
import { Label } from "ui/label";
import { MultiBlock } from "ui/multiblock";
import { MultiValueInput } from "ui/multivalue-input";
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
import { ContextEditorClient } from "~/app/components/ContextEditor/ContextEditorClient";
import { useFormBuilder } from "../FormBuilderContext";
import { FieldInputElement } from "../FormElement";
import { ComponentConfig } from "./ComponentConfig";

type SchemaComponentData = {
	name?: string;
	placeholder?: string;
	demoComponent?: (props: { element: InputElement }) => React.ReactNode;
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
	[InputComponent.multivalueInput]: {
		name: "Multivalue Input",
		demoComponent: () => (
			<div className="flex flex-col gap-1 text-left text-sm">
				<div className="text-gray-500">Label</div>
				<MultiValueInput
					value={["Value 1"]}
					onChange={() => {}}
					// Shrink everything a little to fit into the display box better
					className="h-8"
					valueClassName="h-5 px-1"
				/>
			</div>
		),
	},
	[InputComponent.richText]: {
		name: "Rich Text",
		demoComponent: () => {
			return (
				<div className="isolate h-full w-full text-sm">
					<div className="relative z-10 bg-white text-gray-500">Label</div>
					<ContextEditorClient
						pubs={[]}
						pubTypes={[]}
						onChange={() => {}}
						// Casting since this is a demo component where the pubId and pubTypeId doesn't really matter
						pubId={"" as PubsId}
						pubTypeId={"" as PubTypesId}
						className="-ml-6 -mt-4 h-full w-full overflow-scroll"
					/>
				</div>
			);
		},
	},
	[InputComponent.relationBlock]: {
		name: "Relation Block",
		demoComponent: () => {
			return (
				<div className="flex w-full flex-col gap-1 text-left text-sm">
					<div className="text-gray-500">Label</div>
					<MultiBlock title="Pub Relation" disabled />
				</div>
			);
		},
	},
} as const;

const ComponentSelect = ({
	components,
	onChange,
	value,
	element,
	radioName = "component",
}: {
	components: InputComponent[];
	value: InputComponent;
	onChange: (component: InputComponent) => void;
	element: InputElement;
	radioName?: string;
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
							name={radioName}
							type="radio"
							className="peer sr-only"
							defaultChecked={selected}
							onChange={() => {
								onChange(c);
							}}
						/>
						<div className="flex h-32 w-full flex-col justify-between rounded-lg border bg-card text-card-foreground shadow-sm peer-checked:border-2 peer-checked:border-ring peer-checked:outline-none">
							<label
								className="cursor-pointer"
								htmlFor={`component-${c}`}
								data-testid={`component-${c}`}
							>
								<div
									// 'inert' allows demo components to not be interactive unless they are selected
									inert={selected ? undefined : true}
									className="flex h-24 w-full items-center justify-center p-3"
								>
									{Component && <Component element={element} />}
								</div>
								<hr className="w-full" />
								<div className="my-1 w-full text-center text-sm text-foreground">
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
	fieldInputElement: InputElement;
};

export const InputComponentConfigurationForm = ({ index, fieldInputElement }: Props) => {
	const { update, dispatch, removeIfUnconfigured } = useFormBuilder();

	const { schemaName, isRelation } = fieldInputElement;
	const allowedComponents = componentsBySchema[schemaName];

	const defaultConfig = isRelation
		? { relationshipConfig: { component: InputComponent.relationBlock } }
		: {};

	const form = useForm<ConfigFormData<InputComponent>>({
		// Dynamically set the resolver so that the schema can update based on the selected component
		resolver: (values, context, options) => {
			const schema = Type.Object({
				required: Nullable(Type.Boolean({ default: true })),
				component: Nullable(Type.Enum(InputComponent)),
				// If there is no `component`, it is Null, and so will only have the relationBlockConfigSchema
				config: values.component
					? componentConfigSchemas[values.component]
					: relationBlockConfigSchema,
			});
			const createResolver = typeboxResolver(schema);
			return createResolver(values, context, options);
		},
		defaultValues: { ...fieldInputElement, config: fieldInputElement.config ?? defaultConfig },
	});

	useUnsavedChangesWarning(form.formState.isDirty);

	const component = form.watch("component");

	const onSubmit = (values: ConfigFormData<typeof component>) => {
		const schema = isRelation
			? Type.Composite([relationBlockConfigSchema, componentConfigSchemas[values.component]])
			: componentConfigSchemas[values.component];
		// Some `config` schemas have extra values which persist if we don't Clean first
		const cleanedConfig = Value.Clean(schema, values.config);
		update(index, {
			...fieldInputElement,
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

	// If this is a relationship field, the first component selector on the page will be for the relationship,
	// not the value itself.
	const componentSelector = isRelation ? "config.relationshipConfig.component" : "component";

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
					<FieldInputElement element={fieldInputElement} isEditing={false} />
				</div>
				<div className="text-sm uppercase text-muted-foreground">Appearance</div>
				<hr />
				<FormField
					control={form.control}
					name={componentSelector}
					render={({ field }) => (
						<ComponentSelect
							onChange={field.onChange}
							value={field.value}
							element={fieldInputElement}
							components={
								isRelation ? [InputComponent.relationBlock] : allowedComponents
							}
							radioName={componentSelector}
						/>
					)}
				/>

				{isRelation ? (
					<>
						<ComponentConfig
							schemaName={schemaName}
							form={form}
							component={InputComponent.relationBlock}
						/>
						{schemaName !== CoreSchemaType.Null && (
							<>
								<div className="text-sm uppercase text-muted-foreground">
									Relation value
								</div>
								<hr />
								<div className="text-sm uppercase text-muted-foreground">
									Appearance
								</div>
								<hr />
								{/* Component selector for the relationship value itself */}
								<FormField
									control={form.control}
									name="component"
									render={({ field }) => (
										<ComponentSelect
											onChange={field.onChange}
											value={field.value}
											element={fieldInputElement}
											components={allowedComponents}
											radioName="component"
										/>
									)}
								/>
							</>
						)}
					</>
				) : null}
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
						data-testid="save-configuration-button"
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
