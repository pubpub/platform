"use client";
import { ajvResolver } from "@hookform/resolvers/ajv";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Icon,
	Textarea,
	useLocalStorage,
	useToast,
	Input,
} from "ui";
import { cn } from "utils";
import * as z from "zod";
import { evaluate } from "./actions";
import { GetPubResponseBody, GetPubTypeResponseBody } from "@pubpub/sdk";
import { JSONSchemaType } from "ajv";

type Props = {
	instanceId: string;
	pub: GetPubResponseBody;
	pubType: GetPubTypeResponseBody;
};

const schema = z.object({
	description: z.string().min(1, "Description is required"),
});

interface pubpubSchema {}

const buildFormSchemaFromFields = (pubType) => {
	const schema = {
		$id: `urn:uuid:${pubType.id}`,
		title: `${pubType.name}`,
		type: "object",
		properties: {},
		// this is required due to an AJV bug, per: https://github.com/ajv-validator/ajv/issues/2317
		oneOf: [],
	};

	pubType.fields.forEach((field) => {
		if (!field.schema) {
			schema.properties[field.name] = {
				type: "string",
				title: `${field.name}`,
				$id: `urn:uuid:${field.id}`,
				default: "",
			};
		} else {
			schema.properties[field.name] = field.schema.schema;
		}
	});
	return schema;
};

// todo: array, and more complex types that we might want to handle
const getFormField = (schemaType: "string" | "number", field) => {
	switch (schemaType) {
		case "number":
			return (
				<Input
					type="number"
					{...field}
					onChange={(event) => field.onChange(+event.target.value)}
				/>
			);
			break;
		default:
			return <Input {...field} />;
	}
};

const buildFormFromSchema = (schema, form, schemaIndex?: number, title?: string) => {
	const fields: any[] = [];
	if (schema.properties) {
		Object.entries(schema.properties).forEach(([key, val]: [string, any], fieldIndex) => {
			const fieldTitle = schemaIndex ? schema.title + "." + key : undefined;
			fields.push(buildFormFromSchema(val, form, fieldIndex, fieldTitle));
		});
	} else {
		const fieldTitle = title || schema.title;
		fields.push(
			<FormField
				control={form.control}
				name={fieldTitle}
				key={schema["$id"] || fieldTitle + schemaIndex}
				defaultValue={schema.default}
				render={({ field }) => (
					<FormItem>
						<FormLabel>{schema.title}</FormLabel>
						<FormControl>{getFormField(schema.type, field)}</FormControl>
						<FormDescription>{schema.description}</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
		);
	}
	return fields;
};

export function Evaluate(props: Props) {
	const { pub, pubType } = props;

	const generatedSchema: JSONSchemaType<pubpubSchema> = buildFormSchemaFromFields(pubType);
	console.log(JSON.stringify(generatedSchema));

	const form = useForm({
		mode: "onChange",
		reValidateMode: "onChange",
		resolver: ajvResolver(generatedSchema),
		defaultValues: {},
	});

	const GeneratedFormFields = buildFormFromSchema(generatedSchema, form);
	return (
		<Form {...form}>
			<form>{GeneratedFormFields}</form>
		</Form>
	);
}
