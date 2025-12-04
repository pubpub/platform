"use server"

import type { ActionInstancesId, UsersId } from "db/public"
import type { ActionInstanceRunResult, RunAutomationArgs } from "../_lib/runAutomation"

import { AutomationEvent, Capabilities, MembershipType } from "db/public"

import { getLoginData } from "~/lib/authentication/loginData"
import { userCan } from "~/lib/authorization/capabilities"
import { defineServerAction } from "~/lib/server/defineServerAction"
import { runAutomation } from "../_lib/runAutomation"

export const runAutomationManual = defineServerAction(async function runActionInstance(
	args: Omit<RunAutomationArgs, "userId" | "trigger"> & {
		manualActionInstancesOverrideArgs: {
			[actionInstanceId: ActionInstancesId]: Record<string, unknown>
		}
	}
): Promise<ActionInstanceRunResult> {
	const { user } = await getLoginData()

	if (!user) {
		return {
			success: false,
			error: "Not logged in",
			config: {},
		}
	}

	const canRunAction = args.pubId
		? await userCan(
				Capabilities.runAction,
				{ type: MembershipType.pub, pubId: args.pubId },
				user.id
			)
		: // FIXME: (!!!!!) this is a hack to allow actions to be run without a pubId
			// we should instead check whether the user can run the action on the stage
			true

	if (!canRunAction) {
		return {
			success: false,
			error: "Not authorized to run action",
			config: {},
		}
	}

	const { json: _, pubId: __, ...rest } = args

	const result = await runAutomation({
		...rest,
		userId: user.id as UsersId,
		stack: args.stack ?? [],
		communityId: args.communityId,
		manualActionInstancesOverrideArgs: args.manualActionInstancesOverrideArgs,
		...(args.json ? { json: args.json } : { pubId: args.pubId! }),
		// manual run
		automationId: args.automationId,
		trigger: {
			event: AutomationEvent.manual,
			config: null,
		},
	})

	if (!result.success) {
		return {
			success: false,
			error: result.error,
			config: {},
		}
	}

	return {
		success: true,
		data: result.data,
		report: result.report,
		config: {},
	}
})
