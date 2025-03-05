import type { ProcessedPub } from "contracts";

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
