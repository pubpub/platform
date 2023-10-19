"use client";
import Ajv from "ajv";
import { ajvResolver } from "@hookform/resolvers/ajv";
import { GetPubResponseBody, GetPubTypeResponseBody, PubValues } from "@pubpub/sdk";
import { buildFormFieldsFromSchema, buildFormSchemaFromFields } from "@pubpub/sdk/react";
import { useEffect, useMemo } from "react";
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
	Icon,
	useLocalStorage,
	useToast,
} from "ui";
import { cn } from "utils";
import { evaluate } from "./actions";

type Props = {
	instanceId: string;
	pub: GetPubResponseBody;
	pubType: GetPubTypeResponseBody;
};

export function Evaluate(props: Props) {
	const { pub, pubType } = props;
	const { toast } = useToast();

	// we need to use an uncompiled schema for validation, but compiled for building the form
	// we could return a compiled schema, but ajvResolver complains about, ironically, a resolved schema from ajv
	const generatedSchema = buildFormSchemaFromFields(pubType);
	const ajv = new Ajv();
	const compiledSchema = ajv.addSchema(generatedSchema, "schema");

	const form = useForm({
		mode: "onChange",
		reValidateMode: "onChange",
		// debug instructions: https://react-hook-form.com/docs/useform#resolver
		resolver: ajvResolver(generatedSchema),
		defaultValues: {},
	});

	const [persistedValues, persist] = useLocalStorage<PubValues>(props.instanceId);

	const onSubmit = async (values: PubValues) => {
		values["unjournal:title"] = `Evaluation of "${pub.values["unjournal:title"]}"`;
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

	const formFieldsFromSchema = useMemo(
		() => buildFormFieldsFromSchema(compiledSchema, form.control),
		[form.control]
	);

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)}>
				<Card>
					<CardHeader>
						<CardTitle>{pubType.name}</CardTitle>
						<CardDescription>{pubType.description}</CardDescription>
					</CardHeader>
					<CardContent>{formFieldsFromSchema}</CardContent>
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
