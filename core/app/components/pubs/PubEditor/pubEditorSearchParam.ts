import type { PubsId, StagesId } from "db/public";
import { logger } from "logger";

import type { PubEditorMethod } from "./types";
import { uuidRegex } from "~/lib/regexp";
import { PATH_AWARE_DIALOG_SEARCH_PARAM } from "~/lib/server/pathAwareDialogParams";

export const createPubEditorSearchParamId = (props: ParsedPubEditorSearchParam) => {
	if (props.method !== "create") {
		return `${props.method}-pub-form-${props.pubId}`;
	}
	return `${props.method}-pub-form${props.parentId ? `-parent-${props.parentId}` : ""}${props.stageId ? `-stage-${props.stageId}` : ""}`;
};

/**
 * Matches the following:
 * Either the PubCreate form is created for all stages
 * - create-pub-form
 * Or for a specific stage
 * - create-pub-form-stage-123e4567-e89b-12d3-a456-426614174000
 * Or for a specific parent
 * - create-pub-form-parent-123e4567-e89b-12d3-a456-426614174000
 * Or both
 * - create-pub-form-parent-123e4567-e89b-12d3-a456-426614174000-stage-123e4567-e89b-12d3-a456-426614174000
 * -stage-xx-parent-xx is not supported
 *
 * An update or remove form always has a pubId, and no stage or parent information
 * - update-pub-form-123e4567-e89b-12d3-a456-426614174000
 */
const pubEditorIdRegex = new RegExp(
	[
		`^(?<create>create)-pub-form(-parent-(?<parentId>${uuidRegex.source}))?(-stage-(?<stageId>${uuidRegex.source}))?$`,
		`^(?<updateOrRemove>update|remove)-pub-form-(?<pubId>${uuidRegex.source})$`,
	].join("|")
);

export type ParsedPubEditorSearchParam =
	| {
			method: "create";
			parentId?: PubsId;
			stageId?: StagesId;
	  }
	| {
			method: "update" | "remove";
			pubId: PubsId;
	  };

export const parsePubEditorSearchParam = (
	searchParams?: Record<string, string | string[] | undefined>
) => {
	const pathAwareDialogSearchParam = searchParams?.[PATH_AWARE_DIALOG_SEARCH_PARAM] || "";

	if (!pathAwareDialogSearchParam || typeof pathAwareDialogSearchParam !== "string") {
		return null;
	}

	const matches = pathAwareDialogSearchParam.match(pubEditorIdRegex);

	if (!matches) {
		return null;
	}

	const method = matches.groups?.create ? "create" : matches.groups?.updateOrRemove;

	if (method !== "create" && !matches.groups?.pubId) {
		logger.debug("Invalid pub editor search param", { pathAwareDialogSearchParam });
		return null;
	}

	return { method: method as PubEditorMethod, ...matches.groups } as ParsedPubEditorSearchParam;
};
