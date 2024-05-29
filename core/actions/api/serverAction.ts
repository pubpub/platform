"use server";

import { revalidateTag, unstable_cache } from "next/cache";

import { db } from "~/kysely/database";
import { UsersId } from "~/kysely/types/public/Users";
import { getLoginData } from "~/lib/auth/loginData";
import { defineServerAction } from "~/lib/server/defineServerAction";
import {
	ActionInstanceRunResult,
	RunActionInstanceArgs,
	runActionInstance as runActionInstanceInner,
} from "../_lib/runActionInstance";

export const runActionInstance = defineServerAction(async function runActionInstance(
	args: Omit<RunActionInstanceArgs, "userId" | "event">
): Promise<ActionInstanceRunResult> {
	const user = await getLoginData();

	if (!user) {
		return {
			error: "Not logged in",
		};
	}

	// Retrieve the pub's community id in order to revalidate the next server
	// cache after the action is run.
	const pub = await unstable_cache(
		async () =>
			db
				.selectFrom("pubs")
				.select(["community_id as communityId"])
				.where("id", "=", args.pubId)
				.executeTakeFirst(),
		[args.pubId],
		{
			revalidate: 60 * 60 * 24 * 7,
		}
	)();

	const result = await runActionInstanceInner({
		...args,
		userId: user.id as UsersId,
	});

	if (pub !== undefined) {
		// Because an action can move a pub to a different stage, we need to
		// revalidate the community stage cache.
		revalidateTag(`community-stages_${pub.communityId}`);
		// Revalidate the community action runs cache for the action activity table.
		revalidateTag(`community-action-runs_${pub.communityId}`);
	}

	return result;
});
