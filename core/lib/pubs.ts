import type { ProcessedPub } from "contracts";

import type { GetPubsResult } from "./server";

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

type InputPub = ProcessedPub<{ withStage: true; withLegacyAssignee: true; withPubType: true }>;

export const processedPubToPubResult = <T extends InputPub>(pub: T): GetPubsResult[number] => {
	return {
		...pub,
		values: pub.values.reduce(
			(acc, value) => ({
				...acc,
				[value.fieldSlug]: Array.isArray(acc[value.fieldSlug])
					? [...acc[value.fieldSlug], value.value]
					: value.value,
			}),
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
