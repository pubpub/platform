"use client";

import type { Static } from "@sinclair/typebox";
import type { ReactNode } from "react";
import type { FieldValues, FormState, SubmitErrorHandler } from "react-hook-form";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { typeboxResolver } from "@hookform/resolvers/typebox";
import { Type } from "@sinclair/typebox";
import isEqualWith from "lodash.isequalwith";
import partition from "lodash.partition";
import { useForm } from "react-hook-form";
import { getDefaultValueByCoreSchemaType, getJsonSchemaByCoreSchemaType } from "schemas";

import type { JsonValue, ProcessedPub, ProcessedPubWithForm } from "contracts";
import type { PubsId, StagesId } from "db/public";
import { CoreSchemaType, ElementType } from "db/public";
import { Form } from "ui/form";
import { useUnsavedChangesWarning } from "ui/hooks";
import { cn } from "utils";

import type {
	BasicFormElements,
	FormElements,
	HydratedRelatedFieldValue,
	RelatedFieldValue,
	SingleFormValues,
} from "../../forms/types";
import type { FormElementToggleContext } from "~/app/components/forms/FormElementToggleContext";
import type { DefinitelyHas } from "~/lib/types";
import { useFormElementToggleContext } from "~/app/components/forms/FormElementToggleContext";
import { useCommunity } from "~/app/components/providers/CommunityProvider";
import * as actions from "~/app/components/pubs/PubEditor/actions";
import { SubmitButtons } from "~/app/components/pubs/PubEditor/SubmitButtons";
import { didSucceed, useServerAction } from "~/lib/serverActions";
import { isRelatedValue } from "../../forms/types";
import { RELATED_PUB_SLUG } from "./constants";

const SAVE_WAIT_MS = 5000;

const preparePayload = ({
	formElements,
	formValues,
	formState,
	toggleContext,
	defaultValues,
	arrayDefaults,
	deleted,
}: {
	formElements: BasicFormElements[];
	formValues: FieldValues;
	formState: FormState<FieldValues>;
	toggleContext: FormElementToggleContext;
	defaultValues: Record<
		string,
		HydratedRelatedFieldValue | SingleFormValues | undefined | StagesId
	>;
	arrayDefaults: Record<string, HydratedRelatedFieldValue>;
	deleted: Static<typeof deletedValuesSchema>;
}) => {
	const valuesPayload: Record<string, HydratedRelatedFieldValue[] | JsonValue | Date> = {};
	// Since we send deleted related pubs via `deleted`, remove them from the actual `pubValues` payload
	const deletedRelatedFieldSlugs = deleted.map((d) => d.slug);
	const formElementsWithoutDeletedRelatedFields = formElements.filter(
		(fe) => !deletedRelatedFieldSlugs.find((s) => s === fe.slug)
	);
	for (const { slug } of formElementsWithoutDeletedRelatedFields) {
		if (
			slug &&
			toggleContext.isEnabled(slug) &&
			// Only send fields that were changed. RHF erroneously reports fields as changed (dirty)
			// sometimes even when the default value is the same, so we do the check ourselves
			!isEqualWith(formValues[slug], defaultValues[slug])
		) {
			const val = formValues[slug];
			if (Array.isArray(val)) {
				const filteredVal = val.filter((v: RelatedFieldValue) => {
					const isNew = !v.valueId;
					const isChanged = v.valueId && !isEqualWith(arrayDefaults[v.valueId], v);
					return isNew || isChanged;
				});
				valuesPayload[slug] = filteredVal;
			} else {
				valuesPayload[slug] = val;
			}
		}
	}
	return valuesPayload;
};

/**
 * Set all default values
 * Special case: date pubValues need to be transformed to a Date type to pass validation
 */
const buildDefaultValues = (
	elements: BasicFormElements[],
	pubValues: ProcessedPubWithForm["values"]
) => {
	const defaultValues: FieldValues = { deleted: [] };
	// Build a record of the default values for array elements (related pubs) keyed by pub_values.id
	// for dirty checking in preparePayload
	const arrayDefaults: Record<string, HydratedRelatedFieldValue> = {};
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
				defaultValues[element.slug] = [];
				relatedPubValues.forEach((pv) => {
					if (!isRelatedValue(pv) || pv.id === null) {
						return;
					}
					const relatedVal = {
						value:
							element.schemaName === CoreSchemaType.DateTime &&
							typeof pv.value === "string"
								? new Date(pv.value)
								: pv.value,
						relatedPubId: pv.relatedPubId,
						rank: pv.rank,
						valueId: pv.id,
					};
					defaultValues[element.slug].push(relatedVal);
					arrayDefaults[pv.id] = relatedVal;
				});
			}
		}
	}
	return { defaultValues, arrayDefaults };
};

const deletedValuesSchema = Type.Array(
	Type.Object({
		slug: Type.String(),
		relatedPubId: Type.Unsafe<PubsId>(Type.String()),
	})
);

const staticSchema = {
	deleted: deletedValuesSchema,
	stageId: Type.Optional(Type.Union([Type.Unsafe<StagesId>(Type.String()), Type.Null()])),
};

type StaticSchema = {
	[Property in keyof typeof staticSchema]: Static<(typeof staticSchema)[Property]>;
};

const createSchemaFromElements = (
	elements: BasicFormElements[],
	toggleContext: FormElementToggleContext
) => {
	return Type.Object({
		...Object.fromEntries(
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
		),
		...staticSchema,
	});
};

const isSubmitEvent = (
	e?: React.BaseSyntheticEvent
): e is React.BaseSyntheticEvent<DefinitelyHas<SubmitEvent, "submitter">> => {
	return !!e && "submitter" in e.nativeEvent && !!e.nativeEvent.submitter;
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
	pub: Pick<ProcessedPubWithForm, "id" | "values" | "pubTypeId">;
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
	className?: string;
	withAutoSave?: boolean;
	withButtonElements?: boolean;
	isExternalForm?: boolean;
	relatedPub?: {
		id: PubsId;
		slug: string;
	};
}

export const PubEditorClient = ({
	elements,
	className,
	children,
	isUpdating,
	pub,
	stageId,
	htmlFormId,
	formSlug,
	withAutoSave,
	withButtonElements,
	isExternalForm,
	relatedPub,
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

	const [buttonElements, formElements] = useMemo(
		() => partition(elements, (e) => e.type === ElementType.button),
		[elements]
	);
	const toggleContext = useFormElementToggleContext();

	const schema = useMemo(
		() => createSchemaFromElements(formElements, toggleContext),
		[formElements, toggleContext]
	);

	const [defaultValues, arrayDefaults] = useMemo(() => {
		const { defaultValues, arrayDefaults } = buildDefaultValues(formElements, pub.values);
		return [{ ...defaultValues, stageId }, arrayDefaults];
	}, [formElements, stageId, schema]);

	const resolver = useMemo(() => typeboxResolver(schema), [formElements, toggleContext]);

	const formInstance = useForm<
		Static<ReturnType<typeof createSchemaFromElements>> & StaticSchema
	>({
		resolver,
		defaultValues,
		shouldFocusError: false,
		reValidateMode: "onBlur",
	});

	const handleSubmit = useCallback(
		async (
			formValues: FieldValues & StaticSchema,
			evt: React.BaseSyntheticEvent | undefined,
			autoSave = false
		) => {
			const {
				stageId: stageIdFromForm,
				[RELATED_PUB_SLUG]: relatedPubValue,
				deleted,
				...newValues
			} = formValues;

			const pubValues = preparePayload({
				formElements,
				formValues: newValues,
				formState: formInstance.formState,
				toggleContext,
				defaultValues,
				arrayDefaults,
				deleted,
			});

			const { stageId: stageIdFromButtonConfig, submitButtonId } = getButtonConfig({
				evt,
				withButtonElements,
				buttonElements,
			});

			const newStageId = stageIdFromButtonConfig ?? stageIdFromForm ?? undefined;
			const stageIdChanged = newStageId !== stageId;

			let result;
			if (isUpdating) {
				result = await runUpdatePub({
					pubId: pubId,
					pubValues,
					stageId: stageIdChanged ? newStageId : undefined,
					formSlug,
					continueOnValidationError: autoSave,
					deleted,
				});
			} else {
				result = await runCreatePub({
					formSlug,
					body: {
						id: pubId,
						pubTypeId: pub.pubTypeId,
						values: pubValues,
						stageId: newStageId,
					},
					communityId: community.id,
					addUserToForm: isExternalForm,
				});
				// TODO: this currently overwrites existing pub values of the same field
				if (relatedPub) {
					await runUpdatePub({
						pubId: relatedPub.id,
						pubValues: {
							[relatedPub.slug]: [{ value: relatedPubValue, relatedPubId: pubId }],
						},
						continueOnValidationError: true,
						deleted: [],
					});
				}
			}
			if (didSucceed(result)) {
				// Reset dirty state to prevent the unsaved changes warning from
				// blocking navigation.
				// See https://stackoverflow.com/questions/63953501/react-hook-form-resetting-isdirty-without-clearing-form
				formInstance.reset({
					...formValues,
					stageId: newStageId ?? stageId,
				});

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
			withButtonElements,
			buttonElements,
			pubId,
			isExternalForm,
			relatedPub,
			defaultValues,
			arrayDefaults,
			stageId,
		]
	);

	// Re-validate the form when fields are toggled on/off.
	useEffect(() => {
		formInstance.trigger(Object.keys(formInstance.formState.errors));
	}, [formInstance, toggleContext]);

	useUnsavedChangesWarning(formInstance.formState.isDirty);

	const isSubmitting = formInstance.formState.isSubmitting;

	const handleAutoSave = useCallback(
		(values: FieldValues & StaticSchema, evt: React.BaseSyntheticEvent | undefined) => {
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

	const handleAutoSaveOnError: SubmitErrorHandler<FieldValues & StaticSchema> = (errors) => {
		const validFields = Object.fromEntries(
			Object.entries(formInstance.getValues()).filter(([name, value]) => !(name in errors))
		) as FieldValues & StaticSchema;
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
