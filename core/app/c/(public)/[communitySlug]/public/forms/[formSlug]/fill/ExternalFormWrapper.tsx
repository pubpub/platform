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
import partition from "lodash.partition";
import { useForm } from "react-hook-form";
import { getJsonSchemaByCoreSchemaType } from "schemas";

import type { GetPubResponseBody, JsonValue } from "contracts";
import type { PubsId } from "db/public";
import { CoreSchemaType, ElementType } from "db/public";
import { Button } from "ui/button";
import { Form } from "ui/form";
import { cn } from "utils";

import type { Form as PubPubForm } from "~/lib/server/form";
import { isButtonElement } from "~/app/components/FormBuilder/types";
import * as actions from "~/app/components/PubCRUD/actions";
import { didSucceed, useServerAction } from "~/lib/serverActions";
import { SAVE_STATUS_QUERY_PARAM, SUBMIT_ID_QUERY_PARAM } from "./constants";
import { SubmitButtons } from "./SubmitButtons";

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
	return element?.schemaName === CoreSchemaType.MemberId;
};

const preparePayload = ({
	formElements,
	formValues,
}: {
	formElements: PubPubForm["elements"];
	formValues: FieldValues;
}) => {
	// For sending to the server, we only want form elements, not ones that were on the pub but not in the form.
	// For example, if a pub has an 'email' field but the form does not,
	// we do not want to pass an empty `email` field to the upsert (it will fail validation)
	const payload: Record<string, JsonValue> = {};
	for (const { slug } of formElements) {
		if (slug) {
			payload[slug] = formValues[slug];
		}
	}
	return payload;
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
	for (const de of dateElements) {
		if (de.slug) {
			const pubValue = pubValues[de.slug];
			if (pubValue) {
				defaultValues[de.slug] = new Date(pubValue as string);
			}
		}
	}
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
	const [buttonElements, formElements] = partition(elements, (e) => isButtonElement(e));
	const router = useRouter();
	const pathname = usePathname();
	const params = useSearchParams();
	const [saveTimer, setSaveTimer] = useState<NodeJS.Timeout>();
	const runUpdatePub = useServerAction(actions.upsertPubValues);
	const handleSubmit = async (
		values: FieldValues,
		evt: React.BaseSyntheticEvent<SubmitEvent> | undefined,
		autoSave = false
	) => {
		const fields = preparePayload({
			formElements,
			formValues: values,
		});
		const submitButtonId = evt?.nativeEvent.submitter?.id;
		const submitButtonConfig = buttonElements.find((b) => b.elementId === submitButtonId);
		const stageId = submitButtonConfig?.stageId ?? undefined;
		const result = await runUpdatePub({
			pubId: pub.id as PubsId,
			fields,
			stageId,
		});
		if (didSucceed(result)) {
			const newParams = new URLSearchParams(params);
			const currentTime = `${new Date().getTime()}`;
			if (!autoSave && isComplete(formElements, values)) {
				const submitButtonId = evt?.nativeEvent.submitter?.id;
				if (submitButtonId) {
					newParams.set(SUBMIT_ID_QUERY_PARAM, submitButtonId);
				}
				router.push(`${pathname}?${newParams.toString()}`);
				return;
			}
			newParams.set(SAVE_STATUS_QUERY_PARAM, currentTime);
			router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
		}
	};
	const schema = Type.Object(
		Object.fromEntries(
			formElements
				// only add pubfields to the schema
				.filter((e) => e.type === ElementType.pubfield)
				.map((e) => [
					e.slug as string | undefined,
					e.schemaName
						? Type.Optional(getJsonSchemaByCoreSchemaType(e.schemaName))
						: undefined,
				])
		)
	);
	const formInstance = useForm({
		resolver: typeboxResolver(schema),
		defaultValues: buildDefaultValues(formElements, pub.values),
	});
	const isSubmitting = formInstance.formState.isSubmitting;

	const handleAutoSave = (
		values: FieldValues,
		evt: React.BaseSyntheticEvent<SubmitEvent> | undefined
	) => {
		// Don't auto save while editing the user ID field. the query params
		// will clash and it will be a bad time :(
		const { name } = evt?.target as HTMLInputElement;
		if (isUserSelectField(name, formElements)) {
			return;
		}
		if (saveTimer) {
			clearTimeout(saveTimer);
		}
		const newTimer = setTimeout(async () => {
			// isValid is always `false` to start with. this makes it so the first autosave doesn't fire
			// So we also check if saveTimer isn't defined yet as an indicator that this is the first render
			if (formInstance.formState.isValid || saveTimer === undefined) {
				handleSubmit(values, evt, true);
			}
		}, SAVE_WAIT_MS);
		setSaveTimer(newTimer);
	};

	return (
		<Form {...formInstance}>
			<form
				onChange={formInstance.handleSubmit(handleAutoSave)}
				onSubmit={formInstance.handleSubmit(handleSubmit)}
				className={cn("relative flex flex-col gap-6", className)}
			>
				{children}
				<SubmitButtons
					buttons={buttonElements}
					isDisabled={isSubmitting}
					className="sticky bottom-4 -mr-4 ml-auto -translate-y-[175%] translate-x-full"
				/>
			</form>
		</Form>
	);
};
