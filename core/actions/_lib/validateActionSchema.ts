import type { Action, CommunitiesId } from "db/public";

import { getActionConfigDefaults } from "~/lib/server/actions";

/**
 * parses the data with the action config schema, including defaults
 * and allows for json fields
 */
export const validateActionSchema = async (
	action: Action,
	communityId: CommunitiesId,
	data: Record<string, any>
) => {
	const actionDefaults = await getActionConfigDefaults(communityId, action).executeTakeFirst();
};
