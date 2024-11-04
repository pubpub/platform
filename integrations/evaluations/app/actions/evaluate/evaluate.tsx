"use client";

import { useEffect, useMemo } from "react";
import { ajvResolver } from "@hookform/resolvers/ajv";
import Ajv from "ajv";
import { fullFormats } from "ajv-formats/dist/formats";
import { useForm } from "react-hook-form";

import type { GetPubResponseBody, GetPubTypeResponseBody, PubValues } from "@pubpub/sdk";
import { buildSchemaFromPubFields, SchemaBasedFormFields } from "@pubpub/sdk/react";
import { Button } from "ui/button";
import { Form } from "ui/form";
import { useLocalStorage } from "ui/hooks";
import { Loader2 } from "ui/icon";
import { useToast } from "ui/use-toast";

import type { InstanceConfig } from "~/lib/types";
import { Process } from "~/lib/components/Process";
import { Research } from "~/lib/components/Research";
import { getDeadline } from "~/lib/emails";
import { EvaluatorWhoAccepted } from "~/lib/types";
import { submit, upload } from "./actions";

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

	const { compiledSchema, uncompiledSchema } = useMemo(() => {
		const exclude = [
			props.instanceConfig.titleFieldSlug,
			props.instanceConfig.evaluatorFieldSlug,
		];
		const uncompiledSchema = buildSchemaFromPubFields(pubType, exclude);
		// https://ajv.js.org/api.html#ajv-addschema-schema-object-object-key-string-ajv
		// Add schema(s) to validator instance. This method does not compile schemas
		// (but it still validates them). Because of that dependencies can be added in
		// any order and circular dependencies are supported. It also prevents
		// unnecessary compilation of schemas that are containers for other schemas
		// but not used as a whole.

		// An array of schemas can be passed (schemas should have ids), the second parameter will be ignored.
		// Key can be passed that can be used to reference the schema and will be used as the schema id
		// if there is no id inside the schema. If the key is not passed, the schema id will be used as the key.
		// Once the schema is added, it (and all the references inside it) can be referenced in
		// other schemas and used to validate data.

		// Although addSchema does not compile schemas, explicit compilation is
		// not required - the schema will be compiled when it is used first time.

		// "schema" is a key described above though we can also use the schema id created when building the schema
		// we could later pass multiple for dereferencing
		const compiledSchema = new Ajv({ formats: fullFormats }).addSchema(
			uncompiledSchema,
			"schema"
		);
		return { compiledSchema, uncompiledSchema };
	}, [pubType]);

	const form = useForm({
		mode: "onChange",
		reValidateMode: "onChange",
		// debug instructions: https://react-hook-form.com/docs/useform#resolver
		resolver: ajvResolver(uncompiledSchema, {
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

	const signedUploadUrl = (fileName) => {
		return upload(props.instanceId, pub.id, fileName);
	};

	const submissionUrl = pub.values["legacy-unjournal:url"] as string;
	const submissionTitle = pub.values[props.instanceConfig.titleFieldSlug] as string;
	const submissionAbstract = pub.values["legacy-unjournal:description"] as string;
	const managersNotes = pub.values["legacy-unjournal:managers-notes"] as string;
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
				<Process deadline={deadline} managersNotes={managersNotes} />
				<h2>{pubType.name}</h2>
				<p>{pubType.description}</p>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<SchemaBasedFormFields
							compiledSchema={compiledSchema}
							control={form.control}
							upload={signedUploadUrl}
						/>
						<Button type="submit" disabled={!form.formState.isValid}>
							{form.formState.isSubmitting && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Submit Evaluation
						</Button>
					</form>
				</Form>
			</div>
		</>
	);
}
