import type { ActionInstancesId, PubsId } from "db/public";

import { uuidRegex } from "~/lib/regexp";
import { PATH_AWARE_DIALOG_SEARCH_PARAM } from "~/lib/server/pathAwareDialogParams";

export const createActionRunFormQueryParam = ({
	actionInstanceId,
	pubId,
}: {
	actionInstanceId: ActionInstancesId;
	pubId: PubsId;
}) => `action-run-form-action-${actionInstanceId}-pub-${pubId}` as const;

const actionRunFormRegExp = new RegExp(
	`^action-run-form-action-(?<actionInstanceId>${uuidRegex.source})-pub-(?<pubId>${uuidRegex.source})$`
);

export const parseActionRunFormQueryParam = (
	searchParams?: Record<string, string | string[] | undefined>
) => {
	const pathAwareDialogSearchParam = searchParams?.[PATH_AWARE_DIALOG_SEARCH_PARAM] || "";

	if (!pathAwareDialogSearchParam || typeof pathAwareDialogSearchParam !== "string") {
		return null;
	}

	const matches = pathAwareDialogSearchParam.match(actionRunFormRegExp);

	if (!matches) {
		return null;
	}

	const { actionInstanceId, pubId } = matches.groups as {
		actionInstanceId: ActionInstancesId;
		pubId: PubsId;
	};

	if (!pubId || !actionInstanceId) {
		return null;
	}

	return { actionInstanceId: actionInstanceId, pubId: pubId };
};
