"use server";

import { revalidateTag, unstable_cache } from "next/cache";

import type { ActionInstanceRunResult, RunActionInstanceArgs } from "../_lib/runActionInstance";
import type { UsersId } from "~/kysely/types/public/Users";
import { db } from "~/kysely/database";
import { getLoginData } from "~/lib/auth/loginData";
import { findCommunityIdByPubId } from "~/lib/server/community";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { runActionInstance as runActionInstanceInner } from "../_lib/runActionInstance";

export const runActionInstance = defineServerAction(async function runActionInstance(
	args: Omit<RunActionInstanceArgs, "userId" | "event">
): Promise<ActionInstanceRunResult> {
	const user = await getLoginData();

	if (!user) {
		return {
			error: "Not logged in",
		};
	}

	const communityIdPromise = findCommunityIdByPubId(args.pubId);

	const resultPromise = runActionInstanceInner({
		...args,
		userId: user.id as UsersId,
	});

	const [communityId, result] = await Promise.all([communityIdPromise, resultPromise]);

	if (communityId !== undefined) {
		// Because an action can move a pub to a different stage, we need to
		// revalidate the community stage cache.
		revalidateTag(`community-stages_${communityId}`);
		// Revalidate the community action runs cache for the action activity table.
		revalidateTag(`community-action-runs_${communityId}`);
	}

	return result;
});
