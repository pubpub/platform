import type { Selectable } from "kysely";

import type { ActionRunsId, ApiAccessTokensId, UsersId } from "db/public";
import type { HistoryTableBase, LastModifiedBy } from "db/types";

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

export const createLastModifiedBy = (
	props:
		| {
				userId?: UsersId;
				actionRunId?: ActionRunsId;
				apiAccessTokenId?: ApiAccessTokensId;
		  }
		| "unknown"
		| "system"
): LastModifiedBy => {
	if (props === "unknown" || props === "system") {
		return props;
	}

	if (props.userId) {
		return `user:${props.userId}`;
	}

	if (props.actionRunId) {
		return `action-run:${props.actionRunId}`;
	}

	if (props.apiAccessTokenId) {
		return `api-access-token:${props.apiAccessTokenId}`;
	}

	throw new Error("Invalid lastModifiedBy");
};
