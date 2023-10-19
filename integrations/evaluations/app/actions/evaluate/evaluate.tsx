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
	Separator,
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
	// "Schema" is a key later used to retrieve this schema (we could later pass multiple for dereferencing, for example)
	const exclude = ["unjournal:title", "unjournal:evaluator"];
	const generatedSchema = buildFormSchemaFromFields(pubType, exclude);
	const ajv = new Ajv();
	const schemaKey = "schema";
	const compiledSchema = ajv.addSchema(generatedSchema, schemaKey);

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
		() => buildFormFieldsFromSchema(compiledSchema, schemaKey, form.control),
		[form.control]
	);

	return (
		<>
			<Card>
				<CardHeader>
					<CardDescription>
						Thanks for your interest in evaluating research for the Unjournal! Your
						evaluation will be made public and given a DOI, but you have the option to
						remain anonymous or 'sign your review' and take credit. You will be
						compensated a minimum of $250 for your evaluation work, and will be eligible
						for financial 'most informative evaluation' prizes. See the full guidelines
						on our wiki.
					</CardDescription>
					<Separator />
					<p className={cn("text-sm")}>To evaluate:</p>
					<h1 className={cn("text-2xl")}>{`${pub.values["unjournal:title"]}`}</h1>
					<p className={cn("text-base")}>
						{pub.values["unjournal:description"] &&
							`${pub.values["unjournal:description"]}`}
					</p>
					<p>
						<a href={`${pub.values["unjournal:url"]}`}>View Article</a>
					</p>
					<h2 className={cn("text-sm")}>Manager Notes:</h2>
					<p>
						{pub.values["unjournal:managers-notes"] &&
							`${pub.values["unjournal:managers-notes"]}`}
					</p>
				</CardHeader>
			</Card>
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
		</>
	);
}
