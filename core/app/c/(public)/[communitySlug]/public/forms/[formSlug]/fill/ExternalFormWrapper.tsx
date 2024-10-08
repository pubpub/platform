"use client";

/**
 * Note: we have two "form"s at play here: one is the Form specific to PubPub (renamed to PubPubForm)
 * and the other is a form as in react-hook-form.
 */
import type { ReactNode } from "react";
import type { FieldValues } from "react-hook-form";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { typeboxResolver } from "@hookform/resolvers/typebox";
import { Type } from "@sinclair/typebox";
import partition from "lodash.partition";
import { useForm } from "react-hook-form";
import { getDefaultValueByCoreSchemaType, getJsonSchemaByCoreSchemaType } from "schemas";

import type { GetPubResponseBody, JsonValue } from "contracts";
import type { PubsId, PubTypesId } from "db/public";
import { CoreSchemaType, ElementType } from "db/public";
import { Form } from "ui/form";
import { cn } from "utils";

import type { FormElementToggleContext } from "~/app/components/forms/FormElementToggleContext";
import type { PubValues } from "~/lib/server";
import type { Form as PubPubForm } from "~/lib/server/form";
import { isButtonElement } from "~/app/components/FormBuilder/types";
import { useFormElementToggleContext } from "~/app/components/forms/FormElementToggleContext";
import { useCommunity } from "~/app/components/providers/CommunityProvider";
import * as actions from "~/app/components/pubs/PubEditor/actions";
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
	toggleContext,
}: {
	formElements: PubPubForm["elements"];
	formValues: FieldValues;
	toggleContext: FormElementToggleContext;
}) => {
	// For sending to the server, we only want form elements, not ones that were on the pub but not in the form.
	// For example, if a pub has an 'email' field but the form does not,
	// we do not want to pass an empty `email` field to the upsert (it will fail validation)
	const payload: Record<string, JsonValue> = {};
	for (const { slug } of formElements) {
		if (slug && toggleContext.isEnabled(slug)) {
			payload[slug] = formValues[slug];
		}
	}
	return payload;
};

/**
 * Set all default values
 * Special case: date pubValues need to be transformed to a Date type to pass validation
 */
const buildDefaultValues = (elements: PubPubForm["elements"], pubValues: PubValues) => {
	const defaultValues: FieldValues = { ...pubValues };
	for (const element of elements) {
		if (element.slug && element.schemaName) {
			const pubValue = pubValues[element.slug];
			defaultValues[element.slug] =
				pubValue ?? getDefaultValueByCoreSchemaType(element.schemaName);
			if (element.schemaName === CoreSchemaType.DateTime && pubValue) {
				defaultValues[element.slug] = new Date(pubValue as string);
			}
		}
	}

	return defaultValues;
};

const createSchemaFromElements = (
	elements: PubPubForm["elements"],
	toggleContext: FormElementToggleContext
) => {
	return Type.Object(
		Object.fromEntries(
			elements
				// only add enabled pubfields to the schema
				.filter(
					(e) =>
						e.type === ElementType.pubfield && e.slug && toggleContext.isEnabled(e.slug)
				)
				.map(({ slug, schemaName }) => {
					if (!schemaName) {
						return [slug, undefined];
					}

					const schema = getJsonSchemaByCoreSchemaType(schemaName);
					if (!schema) {
						return [slug, undefined];
					}

					if (schema.type !== "string") {
						return [slug, Type.Optional(schema)];
					}

					// this allows for empty strings, which happens when you enter something
					// in an input field and then delete it
					// TODO: reevaluate whether this should be "" or undefined
					const schemaWithAllowedEmpty = Type.Union([schema, Type.Literal("")], {
						error: schema.error ?? "Invalid value",
					});
					return [slug, schemaWithAllowedEmpty];
				})
		)
	);
};

export const ExternalFormWrapper = ({
	elements,
	className,
	children,
	isUpdating,
	pub,
}: {
	elements: PubPubForm["elements"];
	children: ReactNode;
	isUpdating: boolean;
	className?: string;
	pub: Pick<GetPubResponseBody, "id" | "values" | "pubTypeId">;
}) => {
	const router = useRouter();
	const pathname = usePathname();
	const params = useSearchParams();
	const community = useCommunity();
	const [saveTimer, setSaveTimer] = useState<NodeJS.Timeout>();
	const runUpdatePub = useServerAction(actions.updatePub);
	const runCreatePub = useServerAction(actions.createPubRecursive);
	// Cache pubId
	const [pubId, _] = useState<PubsId>(pub.id as PubsId);

	const [buttonElements, formElements] = useMemo(
		() => partition(elements, (e) => isButtonElement(e)),
		[elements]
	);
	const toggleContext = useFormElementToggleContext();

	const defaultValues = useMemo(() => {
		return buildDefaultValues(formElements, pub.values);
	}, [formElements, pub]);

	const handleSubmit = useCallback(
		async (
			formValues: FieldValues,
			evt: React.BaseSyntheticEvent<SubmitEvent> | undefined,
			autoSave = false
		) => {
			const pubValues = preparePayload({
				formElements,
				formValues,
				toggleContext,
			});
			const submitButtonId = evt?.nativeEvent.submitter?.id;
			const submitButtonConfig = buttonElements.find((b) => b.elementId === submitButtonId);
			const stageId = submitButtonConfig?.stageId ?? undefined;
			let result;
			if (isUpdating) {
				result = await runUpdatePub({
					pubId: pubId,
					pubValues,
					stageId,
				});
			} else {
				result = await runCreatePub({
					body: {
						id: pubId,
						pubTypeId: pub.pubTypeId as PubTypesId,
						values: pubValues as Record<string, any>,
						stageId: stageId,
					},
					communityId: community.id,
				});
			}
			if (didSucceed(result)) {
				const newParams = new URLSearchParams(params);
				const currentTime = `${new Date().getTime()}`;
				if (!isUpdating) {
					newParams.set("pubId", pubId);
				}
				if (!autoSave && isComplete(formElements, pubValues)) {
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
		},
		[formElements, router, pathname, runUpdatePub, pub, community.id, toggleContext]
	);

	const resolver = useMemo(
		() => typeboxResolver(createSchemaFromElements(formElements, toggleContext)),
		[formElements, toggleContext]
	);

	const formInstance = useForm({
		resolver,
		defaultValues,
		shouldFocusError: false,
		reValidateMode: "onBlur",
	});

	// Re-validate the form when fields are toggled on/off.
	useEffect(() => {
		formInstance.trigger(Object.keys(formInstance.formState.errors));
	}, [formInstance, toggleContext]);

	const isSubmitting = formInstance.formState.isSubmitting;

	const handleAutoSave = useCallback(
		(values: FieldValues, evt: React.BaseSyntheticEvent<SubmitEvent> | undefined) => {
			// Only autosave on updating a pub, not on creating
			if (!isUpdating) {
				return;
			}
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
		},
		[formElements, saveTimer, handleSubmit]
	);

	return (
		<Form {...formInstance}>
			<form
				onChange={formInstance.handleSubmit(handleAutoSave)}
				onSubmit={formInstance.handleSubmit(handleSubmit)}
				className={cn("relative isolate flex flex-col gap-6", className)}
			>
				{children}
				<hr />
				<SubmitButtons
					buttons={buttonElements}
					isDisabled={isSubmitting}
					className="flex justify-end"
				/>
			</form>
		</Form>
	);
};
