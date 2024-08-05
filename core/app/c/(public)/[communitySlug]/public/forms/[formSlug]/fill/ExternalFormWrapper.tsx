"use client";

/**
 * Note: we have two "form"s at play here: one is the Form specific to PubPub (renamed to PubPubForm)
 * and the other is a form as in react-hook-form.
 */
import type { ReactNode } from "react";
import type { FieldValues } from "react-hook-form";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { typeboxResolver } from "@hookform/resolvers/typebox";
import { Type } from "@sinclair/typebox";
import { useForm } from "react-hook-form";
import { getJsonSchemaByCoreSchemaType } from "schemas";

import type { GetPubResponseBody, JsonValue } from "contracts";
import type { PubsId } from "db/public";
import { CoreSchemaType } from "db/public";
import { Button } from "ui/button";
import { Form } from "ui/form";
import { cn } from "utils";

import type { Form as PubPubForm } from "~/lib/server/form";
import * as actions from "~/app/components/PubCRUD/actions";
import { didSucceed, useServerAction } from "~/lib/serverActions";
import { COMPLETE_STATUS, SAVE_STATUS_QUERY_PARAM } from "./constants";

const SAVE_WAIT_MS = 5000;

const isComplete = (formElements: PubPubForm["elements"], values: FieldValues) => {
	const requiredElements = formElements.filter((fe) => fe.required && fe.slug);
	requiredElements.forEach((element) => {
		const value = values[element.slug!];
		if (value == null) {
			return false;
		}
	});
	return true;
};

const isUserSelectField = (slug: string, elements: PubPubForm["elements"]) => {
	const element = elements.find((e) => e.slug === slug);
	return element?.schemaName === CoreSchemaType.UserId;
};

const preparePayload = (formElements: PubPubForm["elements"], pubValues: FieldValues) => {
	// For sending to the server, we only want form elements, not ones that were on the pub but not in the form.
	// For example, if a pub has an 'email' field but the form does not,
	// we do not want to pass an empty `email` field to the upsert (it will fail validation)
	const formSlugs = formElements.map((fe) => fe.slug);
	const defaultValues = {};
	formSlugs.forEach((slug) => {
		if (slug) {
			defaultValues[slug] = pubValues[slug];
		}
	});
	return defaultValues;
};

/**
 * Date pubValues need to be transformed to a Date type to pass validation
 */
const buildDefaultValues = (
	elements: PubPubForm["elements"],
	pubValues: Record<string, JsonValue>
) => {
	const defaultValues: FieldValues = { ...pubValues };
	const dateElements = elements.filter((e) => e.schemaName === CoreSchemaType.DateTime);
	dateElements.forEach((de) => {
		if (de.slug) {
			const pubValue = pubValues[de.slug];
			if (pubValue) {
				defaultValues[de.slug] = new Date(pubValue as string);
			}
		}
	});
	return defaultValues;
};

export const ExternalFormWrapper = ({
	pub,
	elements,
	className,
	children,
}: {
	pub: GetPubResponseBody;
	elements: PubPubForm["elements"];
	children: ReactNode;
	className?: string;
}) => {
	const router = useRouter();
	const pathname = usePathname();
	const params = useSearchParams();
	const [saveTimer, setSaveTimer] = useState<NodeJS.Timeout>();
	const runUpdatePub = useServerAction(actions.upsertPubValues);
	const handleSubmit = async (values: FieldValues, autoSave = false) => {
		const fields = preparePayload(elements, values);
		const result = await runUpdatePub({
			pubId: pub.id as PubsId,
			fields,
		});
		if (didSucceed(result)) {
			const newParams = new URLSearchParams(params);
			const currentTime = `${new Date().getTime()}`;
			if (!autoSave && isComplete(elements, values)) {
				newParams.set(SAVE_STATUS_QUERY_PARAM, COMPLETE_STATUS);
			} else {
				newParams.set(SAVE_STATUS_QUERY_PARAM, currentTime);
			}
			router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
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
	const methods = useForm({
		resolver: typeboxResolver(schema),
		defaultValues: buildDefaultValues(elements, pub.values),
	});
	const isSubmitting = methods.formState.isSubmitting;
	const data = methods.watch();

	const handleAutoSave = (evt) => {
		// Don't auto save while editing the user ID field. the query params
		// will clash and it will be a bad time :(
		if (isUserSelectField(evt.target.name, elements)) {
			return;
		}
		if (saveTimer) {
			clearTimeout(saveTimer);
		}
		const newTimer = setTimeout(() => {
			// isValid is always `false` to start with. this makes it so the first autosave doesn't fire
			// So we also check if saveTimer isn't defined yet as an indicator that this is the first render
			if (methods.formState.isValid || saveTimer === undefined) {
				handleSubmit(data, true);
			}
		}, SAVE_WAIT_MS);
		setSaveTimer(newTimer);
	};

	return (
		<Form {...methods}>
			<form
				onChange={(evt) => handleAutoSave(evt)}
				onSubmit={methods.handleSubmit((values) => handleSubmit(values))}
				className={cn("relative flex flex-col gap-6", className)}
			>
				{children}
				<Button
					type="submit"
					disabled={isSubmitting}
					// Make the button fixed next to the bottom of the form as user scrolls
					className="sticky bottom-4 -mr-[100px] -mt-[68px] ml-auto"
				>
					Submit
				</Button>
			</form>
		</Form>
	);
};
