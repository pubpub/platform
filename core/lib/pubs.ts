import type { PubPayload } from "./types";

export const getPubTitle = (pub: PubPayload["children"][number]) => {
	const title = pub.values.find((value) => {
		return value.field.slug === "unjournal:title" || value.field.slug === "pubpub:title";
	});
	return (title?.value as string) || "";
};
