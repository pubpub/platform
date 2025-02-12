import type { JsonValue, ProcessedPub } from "contracts";

import type { GetPubsResult } from "./server";

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

type InputPub = ProcessedPub<{ withStage: true; withLegacyAssignee: true; withPubType: true }>;

/**
 * this is a bridge function for places where we still use the `{ slug: value }` pubvalues shape, rather than an array
 * this is eg the case in the contexteditor at the time of writing (2024-12-18)
 */
export const processedPubToPubResult = <T extends InputPub>(pub: T): GetPubsResult[number] => {
	return {
		...pub,
		values: pub.values.reduce(
			(acc, value) => {
				const existingValue = acc[value.fieldSlug] as JsonValue | JsonValue[] | undefined;

				if (!value?.relatedPubId) {
					acc[value.fieldSlug] = value.value as JsonValue;
					return acc;
				}

				const existingVal = existingValue
					? Array.isArray(existingValue)
						? existingValue
						: [existingValue]
					: [];

				acc[value.fieldSlug] = [
					...existingVal,
					{ relatedPubId: value.relatedPubId, value: value.value as JsonValue },
				];

				return acc;
			},
			{} as GetPubsResult[number]["values"]
		),
		stages: pub.stage ? [pub.stage] : [],
		assigneeId: pub.assignee?.id ?? null,
		assignee: (pub.assignee ?? null) as GetPubsResult[number]["assignee"],
		pubType: pub.pubType as GetPubsResult[number]["pubType"],
		children: pub.children.length ? pub.children.map(processedPubToPubResult) : [],
	};
};

export const processedPubsToPubsResult = (pubs: InputPub[]): GetPubsResult => {
	return pubs.map(processedPubToPubResult);
};

export const getTitleField = <T extends InputPub>(
	pub: T
): T["pubType"]["fields"][number] | undefined => pub.pubType.fields.find((field) => field.isTitle);

export const valuesWithoutTitle = <T extends InputPub>(pub: T): T["values"] => {
	const titleField = getTitleField(pub);
	if (!titleField) {
		return pub.values;
	}
	return pub.values.filter((value) => value.fieldId !== titleField?.id);
};
