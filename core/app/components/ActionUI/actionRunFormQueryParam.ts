import type { ActionInstancesId, PubsId } from "db/public";

import { uuidRegex } from "~/lib/regexp";

export const createActionRunFormQueryParam = (actionInstanceId: ActionInstancesId, pubId: PubsId) =>
	`action-run-form-${actionInstanceId}-${pubId}` as const;

const actionRunFormRegExp = new RegExp(
	`^action-run-form-(${uuidRegex.source})-(${uuidRegex.source})$`
);

export const parseActionRunFormQueryParam = (queryParam: string) => {
	const matches = queryParam.match(actionRunFormRegExp);

	if (!matches) {
		return null;
	}

	const actionInstanceId = matches[1];
	const pubId = matches[2];

	if (!pubId || !actionInstanceId) {
		return null;
	}

	return { actionInstanceId: actionInstanceId as ActionInstancesId, pubId: pubId as PubsId };
};
