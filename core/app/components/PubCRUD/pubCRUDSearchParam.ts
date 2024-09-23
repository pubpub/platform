import type { PubCRUDMethod } from "./types";
import { uuidRegex } from "~/lib/regexp";
import { getModalSearchParam } from "~/lib/server/modal";
import { pubCRUDMethods } from "./types";

export type PubCRUDSearchParamProps =
	| {
			method: "update" | "remove";
			identifyingString: string;
	  }
	| {
			method: "create";
			identifyingString: string;
	  };

export const createPubCRUDSearchParam = ({
	method,
	identifyingString,
}: PubCRUDSearchParamProps) => {
	if (method === "create" && !identifyingString) {
		return "create-pub-form";
	}
	return `${method}-pub-form-${identifyingString}`;
};

const pubCRUDSearchParamRegex = new RegExp(
	`^(${pubCRUDMethods.join("|")})-pub-form-(${uuidRegex.source})$`
);

/**
 * Matches the following:
 * Either the PubCreate form is created for all stages
 * - create-pub-form
 * Or for a specific stage
 * - create-pub-form-123e4567-e89b-12d3-a456-426614174000
 */
const pubCreateSearchParamRegex = new RegExp(`^(create)-pub-form(?:-(${uuidRegex.source}))?$`);

export const parsePubCRUDSearchParam = () => {
	const modalSearchParam = getModalSearchParam() || "";

	const matches = modalSearchParam.match(pubCRUDSearchParamRegex);

	if (!matches) {
		const pubCrudMatches = modalSearchParam.match(pubCreateSearchParamRegex);
		if (!pubCrudMatches) {
			return null;
		}

		const [, method, identifyingString] = pubCrudMatches;

		if (!method) {
			return null;
		}

		return { method: "create" as const, identifyingString };
	}

	const [, method, identifyingString] = matches;

	if (!method || !identifyingString) {
		return null;
	}

	return { method: method as PubCRUDMethod, identifyingString };
};
