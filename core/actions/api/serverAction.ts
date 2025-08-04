"use server";

import type { UsersId } from "db/public";
import { Capabilities, MembershipType } from "db/public";

import type { ActionInstanceRunResult, RunActionInstanceArgs } from "../_lib/runActionInstance";
import { getLoginData } from "~/lib/authentication/loginData";
import { userCan } from "~/lib/authorization/capabilities";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { runActionInstance as runActionInstanceInner } from "../_lib/runActionInstance";

export const runActionInstance = defineServerAction(async function runActionInstance(
	args: Omit<RunActionInstanceArgs, "userId" | "event">
): Promise<ActionInstanceRunResult> {
	const { user } = await getLoginData();

	if (!user) {
		return {
			error: "Not logged in",
			stack: [],
		};
	}

	const canRunAction = await userCan(
		Capabilities.runAction,
		{ type: MembershipType.pub, pubId: args.pubId },
		user.id
	);

	if (!canRunAction) {
		return {
			error: "Not authorized to run action",
			stack: [],
		};
	}

	const result = await runActionInstanceInner({
		...args,
		userId: user.id as UsersId,
		stack: args.stack ?? [],
	});

	return result;
});
