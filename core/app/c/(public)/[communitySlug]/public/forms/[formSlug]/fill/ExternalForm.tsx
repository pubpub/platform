"use client";

/**
 * Note: we have two "form"s at play here: one is the Form specific to PubPub (renamed to PubPubForm)
 * and the other is a form as in react-hook-form.
 */
import type { FieldValues } from "react-hook-form";

import { typeboxResolver } from "@hookform/resolvers/typebox";
import { Type } from "@sinclair/typebox";
import { FormProvider, useForm } from "react-hook-form";
import { getJsonSchemaByCoreSchemaType, registerFormats } from "schemas";

import type { GetPubResponseBody } from "contracts";
import type { PubsId } from "db/public";
import { Button } from "ui/button";
import { toast } from "ui/use-toast";
import { cn } from "utils";

import type { Form as PubPubForm } from "~/lib/server/form";
import * as actions from "~/app/components/PubCRUD/actions";
import { didSucceed, useServerAction } from "~/lib/serverActions";
import { FormElement } from "./FormElement";

export const ExternalForm = ({
	pub,
	elements,
	className,
}: {
	pub: GetPubResponseBody;
	elements: PubPubForm["elements"];
	className?: string;
}) => {
	const runUpdatePub = useServerAction(actions.upsertPubValues);
	const handleSubmit = async (values: FieldValues) => {
		const { pubFields, ...fields } = values;
		const result = await runUpdatePub({
			pubId: pub.id as PubsId,
			fields,
		});
		if (didSucceed(result)) {
			toast({
				title: "Success",
				description: "Pub updated",
			});
		}
	};
	const schema = Type.Object(
		Object.fromEntries(
			elements.map((e) => [
				e.slug as string | undefined,
				e.schemaName
					? Type.Optional(getJsonSchemaByCoreSchemaType(e.schemaName))
					: undefined,
			])
		)
	);
	const methods = useForm({ resolver: typeboxResolver(schema), defaultValues: pub.values });
	const isSubmitting = methods.formState.isSubmitting;

	return (
		<FormProvider {...methods}>
			<form
				onSubmit={methods.handleSubmit(handleSubmit)}
				className={cn("relative flex flex-col gap-6", className)}
			>
				{elements.map((e) => {
					return <FormElement key={e.elementId} element={e} />;
				})}
				<Button
					type="submit"
					disabled={isSubmitting}
					// Make the button fixed next to the bottom of the form as user scrolls
					className="sticky bottom-4 -mr-[100px] -mt-[68px] ml-auto"
				>
					Submit
				</Button>
			</form>
		</FormProvider>
	);
};
