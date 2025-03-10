"use server";

import type { UsersId } from "db/public";

import type { ActionInstanceRunResult, RunActionInstanceArgs } from "../_lib/runActionInstance";
import { getLoginData } from "~/lib/authentication/loginData";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { runActionInstance as runActionInstanceInner } from "../_lib/runActionInstance";

export const runActionInstance = defineServerAction(async function runActionInstance(
	args: Omit<RunActionInstanceArgs, "userId" | "event">
): Promise<ActionInstanceRunResult> {
	const { user } = await getLoginData();

	if (!user) {
		return {
			error: "Not logged in",
		};
	}

	const result = await runActionInstanceInner({
		...args,
		userId: user.id as UsersId,
		stack: args.stack ?? [],
	});

	return result;
});
