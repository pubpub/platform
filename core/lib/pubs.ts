import type { ProcessedPub, ProcessedPubWithForm } from "contracts";
import type { PubFieldsId } from "db/public";
import { ElementType } from "db/public";

import type { FullProcessedPub } from "./server";
import type { Form } from "./server/form";

export type PubTitleProps = {
	title?: string | null;
	createdAt: Date;
	values?:
		| { field: { slug: string }; value: unknown }[]
		| Record<string, unknown>
		| { fieldSlug: string; value: unknown }[];
} & {
	pubType: { name: string };
};

export const getPubTitle = (pub: PubTitleProps): string => {
	const pubTitle = pub.title;

	if (pubTitle) {
		return pubTitle;
	}

	const fallbackTitle = `Untitled ${pub.pubType.name} - ${new Date(pub.createdAt).toDateString()}`;

	if (!pub.values) {
		return fallbackTitle;
	}

	// backup logic for when title is not defined on the pubtype
	if (!Array.isArray(pub.values)) {
		return (
			(Object.entries(pub.values).find(([key]) => key.includes("title"))?.[1] as
				| string
				| undefined) ?? fallbackTitle
		);
	}

	const title = pub.values.find((value) => {
		if ("field" in value) {
			return value.field.slug.includes("title") && value.value;
		}
		return value.fieldSlug.includes("title") && value.value;
	})?.value as string | undefined;

	return title ?? fallbackTitle;
};

type InputPub = ProcessedPub<{ withStage: true; withPubType: true }>;

export const getTitleField = <
	T extends ProcessedPubWithForm<{
		withRelatedPubs: true;
		withStage: true;
		withPubType: true;
		withMembers: true;
	}>,
>(
	pub: T
): T["pubType"]["fields"][number] | undefined => pub.pubType.fields.find((field) => field.isTitle);

export const valuesWithoutTitle = <
	T extends ProcessedPubWithForm<{
		withRelatedPubs: true;
		withStage: true;
		withPubType: true;
		withMembers: true;
	}>,
>(
	pub: T
): T["values"] => {
	const titleField = getTitleField(pub);
	if (!titleField) {
		return pub.values;
	}
	return pub.values.filter((value) => value.fieldId !== titleField?.id);
};

/**
 * Merges a pub with a form so that each pub value also has information from its
 * corresponding form element. This is a full join, such that we will also have
 * form elements that do not have pub values, and pub values that do not have form elements.
 */
export const getPubByForm = ({
	pub,
	form,
	withExtraPubValues,
}: {
	pub: FullProcessedPub;
	form: Form;
	withExtraPubValues: boolean;
}): ProcessedPubWithForm<{
	withRelatedPubs: true;
	withStage: true;
	withPubType: true;
	withMembers: true;
	withStageActionInstances: true;
}> => {
	const { values } = pub;
	if (!values.length) {
		return pub;
	}

	const valuesByFieldSlug = values.reduce<Record<string, FullProcessedPub["values"][number][]>>(
		(acc, value) => {
			if (!acc[value.fieldSlug]) {
				acc[value.fieldSlug] = [value];
			} else {
				acc[value.fieldSlug].push(value);
			}
			return acc;
		},
		{}
	);

	const pubFieldFormElements = form.elements.filter((fe) => fe.type === ElementType.pubfield);
	const valuesWithFormElements: ProcessedPubWithForm<{
		withRelatedPubs: true;
		withStage: true;
		withPubType: true;
		withMembers: true;
		withStageActionInstances: true;
	}>["values"] = [];
	for (const formElement of pubFieldFormElements) {
		const values = valuesByFieldSlug[formElement.slug];
		const formInfo = {
			formElementId: formElement.id,
			formElementLabel: formElement.label,
			formElementConfig: formElement.config,
		};
		if (!values) {
			valuesWithFormElements.push({
				id: null,
				value: null,
				createdAt: null,
				updatedAt: null,
				schemaName: formElement.schemaName,
				fieldId: formElement.fieldId as PubFieldsId,
				fieldSlug: formElement.slug,
				fieldName: formElement.fieldName,
				relatedPubId: null,
				rank: null,
				...formInfo,
			});
		} else {
			for (const value of values) {
				valuesWithFormElements.push({ ...value, ...formInfo });
			}
		}
	}

	if (!withExtraPubValues) {
		return { ...pub, values: valuesWithFormElements };
	}

	const formElementSlugs = new Set(pubFieldFormElements.map((fe) => fe.slug));
	const valueFieldSlugs = new Set(Object.keys(valuesByFieldSlug));
	const slugsNotInForm = Array.from(valueFieldSlugs.difference(formElementSlugs));
	const valuesNotInForm: ProcessedPubWithForm<{
		withRelatedPubs: true;
		withStage: true;
		withPubType: true;
		withMembers: true;
		withStageActionInstances: true;
	}>["values"] = [];
	for (const slug of slugsNotInForm) {
		for (const value of valuesByFieldSlug[slug]) {
			valuesNotInForm.push(value);
		}
	}

	const newValues = [...valuesWithFormElements, ...valuesNotInForm];

	return { ...pub, values: newValues };
};
