import type { Selectable } from "kysely";

import type { ActionRunsId, ApiAccessTokensId, UsersId } from "db/src/public";
import type { HistoryTableBase, LastModifiedBy } from "db/types";

export type PubTitleProps = {
	title?: string | null;
	createdAt: Date;
	values:
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

export const parseLastModifiedBy = (
	lastModifiedBy: LastModifiedBy
): Pick<Selectable<HistoryTableBase>, "actionRunId" | "apiAccessTokenId" | "userId" | "other"> => {
	const base = {
		actionRunId: null,
		apiAccessTokenId: null,
		userId: null,
		other: null,
	};

	if (lastModifiedBy === "unknown") {
		return base;
	}

	if (lastModifiedBy === "system") {
		return {
			actionRunId: null,
			apiAccessTokenId: null,
			userId: null,
			other: "system",
		};
	}

	const [type, id] = lastModifiedBy.split(":");

	switch (type) {
		case "user":
			return {
				...base,
				userId: id as UsersId,
			};
		case "action-run":
			return {
				...base,
				actionRunId: id as ActionRunsId,
			};
		case "api-access-token":
			return {
				...base,
				apiAccessTokenId: id as ApiAccessTokensId,
			};

		default:
			throw new Error(`Invalid lastModifiedBy: ${lastModifiedBy}`);
	}
};
