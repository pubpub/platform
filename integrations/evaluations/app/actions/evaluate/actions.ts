"use server";

import { PubValues } from "@pubpub/sdk";
import { revalidatePath } from "next/cache";
import { expect } from "utils";
import { getInstanceConfig, getInstanceState, setInstanceState } from "~/lib/instance";
import { client } from "~/lib/pubpub";
import { cookie } from "~/lib/request";
import { assertHasAccepted, assertIsInvited } from "~/lib/types";
import {
	scheduleNoSubmitNotificationEmail,
	sendAcceptedNotificationEmail,
	sendDeclinedNotificationEmail,
	sendSubmittedNotificationEmail,
	unscheduleNoReplyNotificationEmail,
	unscheduleNoSubmitNotificationEmail,
	unscheduleReminderEmail,
} from "./emails";

export const accept = async (instanceId: string, pubId: string) => {
	try {
		const user = JSON.parse(expect(cookie("user")));
		const instanceConfig = expect(
			await getInstanceConfig(instanceId),
			"Instance not configured"
		);
		const instanceState = (await getInstanceState(instanceId, pubId)) ?? {};
		const evaluator = expect(
			instanceState[user.id],
			`User was not invited to evaluate pub ${pubId}`
		);
		assertIsInvited(evaluator);
		instanceState[user.id] = {
			...evaluator,
			status: "accepted",
			acceptedAt: new Date().toString(),
		};
		await setInstanceState(instanceId, pubId, instanceState);
		// Unschedule reminder email.
		await unscheduleReminderEmail(instanceId, pubId, evaluator);
		// Unschedule no-reply notification email.
		await unscheduleNoReplyNotificationEmail(instanceId, pubId, evaluator);
		// Immediately send accepted notification email.
		await sendAcceptedNotificationEmail(instanceId, instanceConfig, pubId, evaluator);
		// Schedule no-submit notification email.
		await scheduleNoSubmitNotificationEmail(instanceId, instanceConfig, pubId, evaluator);
		revalidatePath("/");
	} catch (error) {
		return { error: error.message };
	}
};

export const decline = async (instanceId: string, pubId: string) => {
	try {
		const user = JSON.parse(expect(cookie("user")));
		const instanceConfig = expect(
			await getInstanceConfig(instanceId),
			"Instance not configured"
		);
		const instanceState = (await getInstanceState(instanceId, pubId)) ?? {};
		const evaluator = expect(
			instanceState[user.id],
			`User was not invited to evaluate pub ${pubId}`
		);
		assertIsInvited(evaluator);

		instanceState[user.id] = { ...evaluator, status: "declined" };
		await setInstanceState(instanceId, pubId, instanceState);
		// Unschedule reminder email.
		await unscheduleReminderEmail(instanceId, pubId, evaluator);
		// Unschedule no-reply notification email.
		await unscheduleNoReplyNotificationEmail(instanceId, pubId, evaluator);
		// Immediately send declined notification email.
		await sendDeclinedNotificationEmail(instanceId, instanceConfig, pubId, evaluator);
		revalidatePath("/");
	} catch (error) {
		return { error: error.message };
	}
};

export const submit = async (instanceId: string, pubId: string, values: PubValues) => {
	try {
		const user = JSON.parse(expect(cookie("user")));
		const instanceConfig = expect(
			await getInstanceConfig(instanceId),
			"Instance not configured"
		);
		const instanceState = (await getInstanceState(instanceId, pubId)) ?? {};
		if (instanceConfig === undefined) {
			return { error: "Instance not configured" };
		}
		let evaluator = expect(
			instanceState[user.id],
			`User was not invited to evaluate pub ${pubId}`
		);
		assertHasAccepted(evaluator);
		const pub = await client.createPub(instanceId, {
			pubTypeId: instanceConfig.pubTypeId,
			parentId: pubId,
			values: values,
		});
		evaluator = {
			...evaluator,
			status: "received",
			evaluatedAt: new Date().toString(),
			evaluationPubId: pub.id,
		};
		instanceState[user.id] = evaluator;
		await setInstanceState(instanceId, pubId, instanceState);
		// Unschedule no-submit notification email.
		await unscheduleNoSubmitNotificationEmail(instanceId, pubId, evaluator);
		// Immediately send submitted notification email.
		await sendSubmittedNotificationEmail(instanceId, instanceConfig, pubId, evaluator);
		revalidatePath("/");
		return { success: true };
	} catch (error) {
		return { error: error.message };
	}
};
