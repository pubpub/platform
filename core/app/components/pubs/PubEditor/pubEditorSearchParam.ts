import { logger } from "logger";

import type { PubEditorMethod } from "./types";
import { uuidRegex } from "~/lib/regexp";
import { getPathAwareDialogSearchParam } from "~/lib/server/pathAwareDialogParams";
import { pubEditMethods } from "./types";

export type PubEditorSearchParamProps =
	| {
			method: "update" | "remove";
			identifyingString: string;
	  }
	| {
			method: "create";
			identifyingString?: string;
	  };

export const createPubEditorSearchParamId = ({
	method,
	identifyingString,
}: PubEditorSearchParamProps) => {
	if (method === "create" && !identifyingString) {
		return "create-pub-form";
	}
	return `${method}-pub-form-${identifyingString}`;
};

/**
 * Matches the following:
 * Either the PubCreate form is created for all stages
 * - create-pub-form
 * Or for a specific stage
 * - create-pub-form-123e4567-e89b-12d3-a456-426614174000
 */
const pubEditorIdRegex = new RegExp(
	`^(${pubEditMethods.join("|")})-pub-form(-(${uuidRegex.source}))?$`
);

export const parsePubEditorSearchParam = () => {
	const pathAwareDialogSearchParam = getPathAwareDialogSearchParam() || "";

	const matches = pathAwareDialogSearchParam.match(pubEditorIdRegex);

	if (!matches) {
		return null;
	}

	const [, method, identifyingString] = matches;

	if (method !== "create" && !identifyingString) {
		logger.debug("Invalid pub editor search param", { pathAwareDialogSearchParam });
		return null;
	}

	return { method: method as PubEditorMethod, identifyingString };
};
