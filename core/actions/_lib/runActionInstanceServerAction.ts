import { UsersId } from "~/kysely/types/public/Users";
import { getLoginData } from "~/lib/auth/loginData";
import {
	ActionInstanceRunResult,
	RunActionInstanceArgs,
	runActionInstance as runActionInstanceInner,
} from "./runActionInstance";

export const runActionInstanceServerAction = async function runActionInstance(
	args: Omit<RunActionInstanceArgs, "userId" | "event">
): Promise<ActionInstanceRunResult> {
	const user = await getLoginData();

	if (!user) {
		return {
			error: "Not logged in",
		};
	}

	return runActionInstanceInner({
		...args,
		userId: user.id as UsersId,
	});
};
