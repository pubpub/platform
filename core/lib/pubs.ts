export interface PubTitleProps {
	values:
		| { field: { slug: string }; value: unknown }[]
		| Record<string, unknown>
		| { fieldSlug: string; value: unknown }[];
	createdAt: Date;
}

export const getPubTitle = (pub: PubTitleProps): string => {
	const fallbackTitle = `Untitled Pub - ${new Date(pub.createdAt).toDateString()}`;
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
