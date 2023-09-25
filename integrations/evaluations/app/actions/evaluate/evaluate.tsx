"use client";
import Ajv2020 from "ajv/dist/2020";
const ajv = new Ajv2020();
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

type Props = {
	instanceId: string;
	pub: GetPubResponseBody;
	pubType: GetPubTypeResponseBody;
};

const schema = z.object({
	description: z.string().min(1, "Description is required"),
});

const buildFormSchemaFromFields = (pubType) => {
	const schema = {
		$id: `urn:uuid:${pubType.id}`,
		title: `${pubType.name}`,
		type: "object",
		properties: {},
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

const buildFormFromSchema = (schema, form, iterator?: number) => {
	const fields: any[] = [];
	if (schema.properties) {
		Object.entries(schema.properties).forEach(([key, val]: [any, any]) => {
			fields.push(buildFormFromSchema(val, form, key));
		});
	} else {
		switch (schema.type) {
			case "integer":
				fields.push(
					<FormField
						control={form.control}
						name={schema.title}
						key={schema["$id"] || schema.title + iterator}
						defaultValue={schema.default}
						render={({ field }) => (
							<FormItem>
								<FormLabel>{schema.title}</FormLabel>
								<FormControl>
									<Input type="number" {...field} />
								</FormControl>
								<FormDescription>{schema.description}</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				);
				break;
			default:
				fields.push(
					<FormField
						control={form.control}
						name={schema.title}
						key={schema["$id"] || schema.title + iterator}
						defaultValue={schema.default}
						render={({ field }) => (
							<FormItem>
								<FormLabel>{schema.title}</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormDescription>{schema.description}</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				);
		}
	}
	return fields;
};

export function Evaluate(props: Props) {
	const { pub, pubType } = props;

	const generatedSchema = buildFormSchemaFromFields(pubType);

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
