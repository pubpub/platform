import type { ActionInstancesId, PubsId } from "db/public";

export const createActionRunFormQueryParam = (actionInstanceId: ActionInstancesId, pubId: PubsId) =>
	`action-run-form-${actionInstanceId}-${pubId}` as const;

const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

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
