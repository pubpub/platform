"use server";

import type { UsersId } from "db/public";
import { Capabilities, MembershipType } from "db/public";

import type { ActionInstanceRunResult, RunActionInstanceArgs } from "../_lib/runActionInstance";
import { getLoginData } from "~/lib/authentication/loginData";
import { userCan } from "~/lib/authorization/capabilities";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { runActionInstance as runActionInstanceInner } from "../_lib/runActionInstance";

export const runActionInstance = defineServerAction(async function runActionInstance(
	args: Omit<RunActionInstanceArgs, "userId" | "event" | "config">
): Promise<ActionInstanceRunResult> {
	const { user } = await getLoginData();

	if (!user) {
		return {
			error: "Not logged in",
			stack: [],
		};
	}

	const canRunAction = args.pubId
		? await userCan(
				Capabilities.runAction,
				{ type: MembershipType.pub, pubId: args.pubId },
				user.id
			)
		: // FIXME: (!!!!!) this is a hack to allow actions to be run without a pubId
			// we should instead check whether the user can run the action on the stage
			true;

	if (!canRunAction) {
		return {
			error: "Not authorized to run action",
			stack: [],
		};
	}

	const { json: _, pubId: __, ...rest } = args;

	const result = await runActionInstanceInner({
		...rest,
		userId: user.id as UsersId,
		stack: args.stack ?? [],
		...(args.json ? { json: args.json } : { pubId: args.pubId! }),
		config: null,
	});

	return result;
});
