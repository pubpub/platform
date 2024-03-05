"use client";

import { ajvResolver } from "@hookform/resolvers/ajv";
import { GetPubResponseBody, GetPubTypeResponseBody, PubValues } from "@pubpub/sdk";
import { buildFormFieldsFromSchema, buildFormSchemaFromFields } from "@pubpub/sdk/react";
import Ajv from "ajv";
import { fullFormats } from "ajv-formats/dist/formats";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Process } from "~/lib/components/Process";
import { Research } from "~/lib/components/Research";
import { EvaluatorWhoAccepted, InstanceConfig } from "~/lib/types";
import { submit, upload } from "./actions";
import { getDeadline } from "~/lib/emails";
import { useToast } from "ui/use-toast";
import { useLocalStorage } from "ui/hooks";
import { Form } from "ui/form";
import { Button } from "ui/button";
import { Loader2 } from "ui/icon";

type Props = {
	instanceId: string;
	instanceConfig: InstanceConfig;
	pub: GetPubResponseBody;
	pubType: GetPubTypeResponseBody;
	evaluator: EvaluatorWhoAccepted;
};

export function Evaluate(props: Props) {
	const { pub, pubType } = props;
	const { toast } = useToast();

	const generatedSchema = useMemo(() => {
		const exclude = [
			props.instanceConfig.titleFieldSlug,
			props.instanceConfig.evaluatorFieldSlug,
		];
		return buildFormSchemaFromFields(pubType, exclude);
	}, [pubType]);

	const form = useForm({
		mode: "onChange",
		reValidateMode: "onChange",
		// debug instructions: https://react-hook-form.com/docs/useform#resolver
		resolver: ajvResolver(generatedSchema, {
			formats: fullFormats,
		}),
		defaultValues: {},
	});

	const [persistedValues, persist] = useLocalStorage<PubValues>(props.instanceId);

	const onSubmit = async (values: PubValues) => {
		values[props.instanceConfig.titleFieldSlug] = `Evaluation of "${
			pub.values[props.instanceConfig.titleFieldSlug]
		}"`;
		const result = await submit(props.instanceId, pub.id, values);
		if ("error" in result && typeof result.error === "string") {
			toast({
				title: "Error",
				description: result.error,
				variant: "destructive",
			});
		} else {
			toast({
				title: "Success",
				description: "Your evaluation was submitted successfully!",
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

	const generateSignedUploadUrl = (fileName) => {
		return upload(props.instanceId, pub.id, fileName);
	};

	const formFieldsFromSchema = useMemo(() => {
		// we need to use an uncompiled schema for validation, but compiled for building the form
		// "Schema" is a key later used to retrieve this schema (we could later pass multiple for dereferencing, for example)
		const ajv = new Ajv({ formats: fullFormats });
		const schemaKey = "schema";
		const compiledSchema = ajv.addSchema(generatedSchema, schemaKey);
		return buildFormFieldsFromSchema(
			compiledSchema,
			schemaKey,
			form.control,
			generateSignedUploadUrl
		);
	}, [form.control, pubType, generatedSchema]);

	const submissionUrl = pub.values["unjournal:url"] as string;
	const submissionTitle = pub.values[props.instanceConfig.titleFieldSlug] as string;
	const submissionAbstract = pub.values["unjournal:description"] as string;
	const deadline = getDeadline(props.instanceConfig, props.evaluator);

	return (
		<>
			<div className="prose max-w-none">
				<Research
					title={submissionTitle}
					abstract={submissionAbstract}
					url={submissionUrl}
					evaluating
				/>
				<Process deadline={deadline} />
				<h2>{pubType.name}</h2>
				<p>{pubType.description}</p>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						{formFieldsFromSchema}
						<Button type="submit" disabled={!form.formState.isValid}>
							{form.formState.isSubmitting && (
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
							)}
							Submit Evaluation
						</Button>
					</form>
				</Form>
			</div>
		</>
	);
}
