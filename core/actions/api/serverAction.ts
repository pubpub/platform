"use server";

import type { ActionInstanceRunResult, RunActionInstanceArgs } from "../_lib/runActionInstance";
import type { UsersId } from "~/kysely/types/public/Users";
import { getLoginData } from "~/lib/auth/loginData";
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

	const result = await runActionInstanceInner({
		...args,
		userId: user.id as UsersId,
	});

	return result;
});
