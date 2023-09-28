"use client";
import { ajvResolver } from "@hookform/resolvers/ajv";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
	Button,
	Card,
	CardDescription,
	CardHeader,
	CardFooter,
	Form,
	Icon,
	Input,
	useLocalStorage,
	useToast,
	CardContent,
	CardTitle,
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

export function Evaluate(props: Props) {
	const { pub, pubType } = props;
	const { toast } = useToast();

	const generatedSchema = buildFormSchemaFromFields(pubType);

	const form = useForm({
		mode: "onChange",
		reValidateMode: "onChange",
		resolver: ajvResolver(generatedSchema),
		defaultValues: {},
	});

	const [persistedValues, persist] = useLocalStorage<any>(props.instanceId);

	const onSubmit = async (values) => {
		values.Title = `Evaluation of "${pub.values["unjournal/title"]}"`;
		const result = await evaluate(props.instanceId, pub.id, values);
		if ("error" in result && typeof result.error === "string") {
			toast({
				title: "Error",
				description: result.error,
				variant: "destructive",
			});
		} else {
			toast({
				title: "Success",
				description: "The pub was created successfully",
			});
			form.reset();
		}
	};

	const { reset } = form;
	useEffect(() => {
		reset(persistedValues, { keepDefaultValues: true });
	}, [reset]);

	const values = form.watch();
	useEffect(() => {
		persist(values);
	}, [values]);

	const GeneratedFormFields = buildFormFromSchema(generatedSchema, form);

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)}>
				<Card>
					<CardHeader>
						<CardTitle>{pubType.name}</CardTitle>
						<CardDescription>{pubType.description}</CardDescription>
					</CardHeader>
					<CardContent>{GeneratedFormFields}</CardContent>
					<CardFooter className={cn("flex justify-between")}>
						<Button
							variant="outline"
							onClick={(e) => {
								e.preventDefault();
								window.history.back();
							}}
						>
							Go Back
						</Button>
						<Button type="submit" disabled={!form.formState.isValid}>
							{form.formState.isSubmitting && (
								<Icon.Loader2 className="h-4 w-4 mr-2 animate-spin" />
							)}
							Submit Evaluation
						</Button>
					</CardFooter>
				</Card>
			</form>
		</Form>
	);
}
