"use client";
import { ajvResolver } from "@hookform/resolvers/ajv";
import { useEffect } from "react";
import { ControllerRenderProps, UseFormReturn, useForm } from "react-hook-form";
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
import { buildFormFromSchema, buildFormSchemaFromFields } from "@pubpub/sdk/react";
type Props = {
	instanceId: string;
	pub: GetPubResponseBody;
	pubType: GetPubTypeResponseBody;
};

const schema = z.object({
	description: z.string().min(1, "Description is required"),
});

// a bit of a hack, but allows us to use AJV's JSON schema type
interface pubpubSchema {}

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
