export interface PubTitleProps {
	id: string;
	values: { field: { slug: string }; value: unknown }[] | Record<string, unknown>;
	createdAt: Date;
}

// Function to find the value associated with a key containing the desired text
function findValueByKeySubstring(obj: Record<string, any>, substring: string): any | undefined {
	for (const key in obj) {
		if (key.includes(substring)) {
			return obj[key];
		}
	}
	return undefined;
}

export const getPubTitle = (pub: PubTitleProps) => {
	const title = (
		Array.isArray(pub.values)
			? pub.values.find((value) => {
					return value.field.slug.includes("title") && value.value;
				})?.value
			: findValueByKeySubstring(pub.values, "title")
	) as string | undefined;
	const fallbackTitle = `Untitled Pub - ${new Date(pub.createdAt).toDateString()}`;
	return title ?? fallbackTitle;
};
