"use client";

import type { Static } from "@sinclair/typebox";
import type { ReactNode } from "react";
import type { FieldValues, FormState, SubmitErrorHandler } from "react-hook-form";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { typeboxResolver } from "@hookform/resolvers/typebox";
import { Type } from "@sinclair/typebox";
import partition from "lodash.partition";
import { useForm } from "react-hook-form";
import { getDefaultValueByCoreSchemaType, getJsonSchemaByCoreSchemaType } from "schemas";

import type { JsonValue, ProcessedPub } from "contracts";
import type { PubsId, PubTypesId, StagesId } from "db/public";
import { CoreSchemaType, ElementType } from "db/public";
import { Form } from "ui/form";
import { useUnsavedChangesWarning } from "ui/hooks";
import { cn } from "utils";

import type { BasicFormElements, FormElements } from "../../forms/types";
import type { FormElementToggleContext } from "~/app/components/forms/FormElementToggleContext";
import type { DefinitelyHas } from "~/lib/types";
import { useFormElementToggleContext } from "~/app/components/forms/FormElementToggleContext";
import { useCommunity } from "~/app/components/providers/CommunityProvider";
import * as actions from "~/app/components/pubs/PubEditor/actions";
import { SubmitButtons } from "~/app/components/pubs/PubEditor/SubmitButtons";
import { didSucceed, useServerAction } from "~/lib/serverActions";

const SAVE_WAIT_MS = 5000;

const preparePayload = ({
	formElements,
	formValues,
	formState,
	toggleContext,
}: {
	formElements: BasicFormElements[];
	formValues: FieldValues;
	formState: FormState<FieldValues>;
	toggleContext: FormElementToggleContext;
}) => {
	const payload: Record<string, JsonValue> = {};
	for (const { slug } of formElements) {
		if (
			slug &&
			toggleContext.isEnabled(slug) &&
			// Only send fields that were changed.
			// TODO: this check doesn't quite work for related pub field arrays.
			// perhaps they are initialized differently so always show up as dirty?
			formState.dirtyFields[slug]
		) {
			payload[slug] = formValues[slug];
		}
	}
	return payload;
};

/**
 * Set all default values
 * Special case: date pubValues need to be transformed to a Date type to pass validation
 */
const buildDefaultValues = (elements: BasicFormElements[], pubValues: ProcessedPub["values"]) => {
	const defaultValues: FieldValues = {};
	for (const element of elements) {
		if (element.slug && element.schemaName) {
			const pubValue = pubValues.find((v) => v.fieldSlug === element.slug)?.value;

			defaultValues[element.slug] =
				pubValue ?? getDefaultValueByCoreSchemaType(element.schemaName);
			if (element.schemaName === CoreSchemaType.DateTime && pubValue) {
				defaultValues[element.slug] = new Date(pubValue as string);
			}
			// There can be multiple relations for a single slug
			if (element.isRelation) {
				const relatedPubValues = pubValues.filter((v) => v.fieldSlug === element.slug);
				defaultValues[element.slug] = relatedPubValues.map((pv) => ({
					value:
						pv.schemaName === CoreSchemaType.DateTime
							? new Date(pv.value as string)
							: pv.value,
					relatedPubId: pv.relatedPubId,
				}));
			}
		}
	}
	return defaultValues;
};

const createSchemaFromElements = (
	elements: BasicFormElements[],
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
				.map(({ slug, schemaName, config, isRelation }) => {
					if (!schemaName) {
						return [slug, undefined];
					}

					const schema = getJsonSchemaByCoreSchemaType(schemaName, config);
					if (!schema) {
						return [slug, undefined];
					}

					// Allow fields to be empty or optional. Special case for empty strings,
					// which happens when you enter something in an input field and then delete it
					// TODO: reevaluate whether this should be "" or undefined
					const schemaAllowEmpty =
						schema.type === "string"
							? Type.Union([schema, Type.Literal("")], {
									error: schema.error ?? "Invalid value",
								})
							: Type.Optional(schema);

					if (isRelation) {
						return [
							slug,
							Type.Array(
								Type.Object(
									{
										relatedPubId: Type.String(),
										value: schemaAllowEmpty,
									},
									{ additionalProperties: true, error: "object error" }
								),
								{ error: "array error" }
							),
						];
					}

					return [slug, schemaAllowEmpty];
				})
		)
	);
};

const isSubmitEvent = (
	e?: React.BaseSyntheticEvent
): e is React.BaseSyntheticEvent<DefinitelyHas<SubmitEvent, "submitter">> => {
	return !!e && "submitter" in e.nativeEvent && !!e.nativeEvent.submitter;
};

const useRelatedPub = ({ pubId }: { pubId: PubsId }) => {
	const searchParams = useSearchParams();
	const relatedPubId = searchParams.get("relatedPubId") as PubsId;
	const slug = searchParams.get("slug");
	// TODO: rehydrate value?
	const value = searchParams.get("value");
	if (!relatedPubId || !slug) {
		return undefined;
	}
	return { pubId: relatedPubId, values: { [slug]: [{ relatedPubId: pubId, value }] } };
};

const getButtonConfig = ({
	evt,
	withButtonElements,
	buttonElements,
}: {
	evt: React.BaseSyntheticEvent | undefined;
	withButtonElements?: boolean;
	buttonElements: FormElements[];
}) => {
	if (!withButtonElements) {
		return { stageId: undefined, submitButtonId: undefined };
	}
	const submitButtonId = isSubmitEvent(evt) ? evt.nativeEvent.submitter.id : undefined;
	const submitButtonConfig = submitButtonId
		? buttonElements.find((b) => b.id === submitButtonId)
		: undefined;
	const stageId = submitButtonConfig?.stageId ?? undefined;
	return { stageId, submitButtonId: submitButtonId };
};

export interface PubEditorClientProps {
	elements: BasicFormElements[];
	children: ReactNode;
	isUpdating: boolean;
	pub: Pick<ProcessedPub, "id" | "values" | "pubTypeId">;
	onSuccess: (args: {
		values: FieldValues;
		submitButtonId?: string;
		isAutoSave: boolean;
	}) => void;
	stageId?: StagesId;
	/** Slug of the Form this editor is using */
	formSlug: string;
	/** ID for the HTML form */
	htmlFormId?: string;
	parentId?: PubsId;
	className?: string;
	withAutoSave?: boolean;
	withButtonElements?: boolean;
	isExternalForm?: boolean;
}

export const PubEditorClient = ({
	elements,
	className,
	children,
	isUpdating,
	pub,
	stageId,
	htmlFormId,
	parentId,
	formSlug,
	withAutoSave,
	withButtonElements,
	isExternalForm,
	onSuccess,
}: PubEditorClientProps) => {
	const router = useRouter();
	const pathname = usePathname();
	const community = useCommunity();
	const [saveTimer, setSaveTimer] = useState<NodeJS.Timeout>();
	const runUpdatePub = useServerAction(actions.updatePub);
	const runCreatePub = useServerAction(actions.createPubRecursive);
	// Cache pubId
	const [pubId, _] = useState<PubsId>(pub.id as PubsId);
	const relatedPub = useRelatedPub({ pubId });

	const [buttonElements, formElements] = useMemo(
		() => partition(elements, (e) => e.type === ElementType.button),
		[elements]
	);
	const toggleContext = useFormElementToggleContext();

	const defaultValues = useMemo(() => {
		const defaultPubValues = buildDefaultValues(formElements, pub.values);
		return { ...defaultPubValues, stageId };
	}, [formElements, pub]);

	const resolver = useMemo(
		() => typeboxResolver(createSchemaFromElements(formElements, toggleContext)),
		[formElements, toggleContext]
	);

	const formInstance = useForm<Static<ReturnType<typeof createSchemaFromElements>>>({
		resolver,
		defaultValues,
		shouldFocusError: false,
		reValidateMode: "onBlur",
	});

	const handleSubmit = useCallback(
		async (
			formValues: FieldValues,
			evt: React.BaseSyntheticEvent | undefined,
			autoSave = false
		) => {
			const { stageId: stageIdFromForm, ...newValues } = formValues;

			const pubValues = preparePayload({
				formElements,
				formValues: newValues,
				formState: formInstance.formState,
				toggleContext,
			});

			const { stageId: stageIdFromButtonConfig, submitButtonId } = getButtonConfig({
				evt,
				withButtonElements,
				buttonElements,
			});

			const stageId = stageIdFromForm ?? stageIdFromButtonConfig;
			let result;
			if (isUpdating) {
				result = await runUpdatePub({
					pubId: pubId,
					pubValues,
					stageId,
					formSlug,
					continueOnValidationError: autoSave,
				});
			} else {
				result = await runCreatePub({
					formSlug,
					body: {
						id: pubId,
						pubTypeId: pub.pubTypeId as PubTypesId,
						values: pubValues as Record<string, any>,
						stageId: stageId,
					},
					communityId: community.id,
					addUserToForm: isExternalForm,
				});
				if (relatedPub) {
					await runUpdatePub({
						pubId: relatedPub.pubId,
						pubValues: relatedPub.values,
						continueOnValidationError: true,
					});
				}
			}
			if (didSucceed(result)) {
				// Reset dirty state to prevent the unsaved changes warning from
				// blocking navigation.
				// See https://stackoverflow.com/questions/63953501/react-hook-form-resetting-isdirty-without-clearing-form
				formInstance.reset(
					{},
					{
						keepValues: true,
					}
				);
				onSuccess({ isAutoSave: autoSave, submitButtonId, values: pubValues });
			}
		},
		[
			formElements,
			formInstance.formState,
			router,
			pathname,
			runUpdatePub,
			pub,
			community.id,
			toggleContext,
		]
	);

	// Re-validate the form when fields are toggled on/off.
	useEffect(() => {
		formInstance.trigger(Object.keys(formInstance.formState.errors));
	}, [formInstance, toggleContext]);

	useUnsavedChangesWarning(formInstance.formState.isDirty);

	const isSubmitting = formInstance.formState.isSubmitting;

	const handleAutoSave = useCallback(
		(values: FieldValues, evt: React.BaseSyntheticEvent | undefined) => {
			if (saveTimer) {
				clearTimeout(saveTimer);
			}
			const newTimer = setTimeout(async () => {
				// isValid is always `false` to start with. this makes it so the first autosave doesn't fire
				// So we also check if saveTimer isn't defined yet as an indicator that this is the first render
				handleSubmit(values, evt, true);
			}, SAVE_WAIT_MS);
			setSaveTimer(newTimer);
		},
		[formElements, saveTimer, handleSubmit]
	);

	const handleAutoSaveOnError: SubmitErrorHandler<FieldValues> = (errors) => {
		const validFields = Object.fromEntries(
			Object.entries(formInstance.getValues()).filter(([name, value]) => !(name in errors))
		);
		handleAutoSave(validFields, undefined);
	};

	return (
		<Form {...formInstance}>
			<form
				onChange={
					withAutoSave
						? formInstance.handleSubmit(handleAutoSave, handleAutoSaveOnError)
						: undefined
				}
				onSubmit={formInstance.handleSubmit(handleSubmit)}
				className={cn("relative isolate flex flex-col gap-6", className)}
				id={htmlFormId}
			>
				{children}
				{withButtonElements ? (
					<>
						<hr />
						<SubmitButtons
							buttons={buttonElements}
							isDisabled={isSubmitting}
							className="flex justify-end"
						/>
					</>
				) : null}
			</form>
		</Form>
	);
};
