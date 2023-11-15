"use server";

import { expect } from "utils";
import {
	scheduleNoSubmitNotificationEmail,
	sendAcceptedEmail,
	sendAcceptedNotificationEmail,
	sendDeclinedNotificationEmail,
	sendRequestedInfoNotification,
	unscheduleNoReplyNotificationEmail,
	unscheduleReminderEmail,
} from "~/lib/emails";
import { getInstanceConfig, getInstanceState, setInstanceState } from "~/lib/instance";
import { cookie } from "~/lib/request";
import { assertIsInvited } from "~/lib/types";

export const accept = async (instanceId: string, pubId: string) => {
	try {
		const user = JSON.parse(expect(cookie("user")));
		const instanceConfig = expect(
			await getInstanceConfig(instanceId),
			"Instance not configured"
		);
		const instanceState = (await getInstanceState(instanceId, pubId)) ?? {};
		let evaluator = expect(
			instanceState[user.id],
			`User was not invited to evaluate pub ${pubId}`
		);
		// Accepting again is a no-op.
		if (evaluator.status === "accepted" || evaluator.status === "received") {
			return { success: true };
		}
		// Assert the user is invited to evaluate this pub.
		assertIsInvited(evaluator);
		// Update the evaluator's status to accepted and add recored the time of
		// acceptance.
		evaluator = instanceState[user.id] = {
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
		// Immediately send accepted email to evaluator.
		await sendAcceptedEmail(instanceId, instanceConfig, pubId, evaluator);
		// Schedule no-submit notification email.
		await scheduleNoSubmitNotificationEmail(instanceId, instanceConfig, pubId, evaluator);
		return { success: true };
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
		let evaluator = expect(instanceState[user.id], "User was not invited to evaluate this pub");
		// Declining again is a no-op.
		if (evaluator.status === "declined") {
			return { success: true };
		}
		// Assert the user is invited to evaluate this pub.
		assertIsInvited(evaluator);
		// Update the evaluator's status to declined.
		evaluator = instanceState[user.id] = { ...evaluator, status: "declined" };
		await setInstanceState(instanceId, pubId, instanceState);
		// Unschedule reminder email.
		await unscheduleReminderEmail(instanceId, pubId, evaluator);
		// Unschedule no-reply notification email.
		await unscheduleNoReplyNotificationEmail(instanceId, pubId, evaluator);
		// Immediately send declined notification email.
		await sendDeclinedNotificationEmail(instanceId, instanceConfig, pubId, evaluator);
		return { success: true };
	} catch (error) {
		return { error: error.message };
	}
};

export const contact = async (instanceId: string, pubId: string) => {
	try {
		const user = JSON.parse(expect(cookie("user")));
		const instanceConfig = expect(
			await getInstanceConfig(instanceId),
			"Instance not configured"
		);
		const instanceState = (await getInstanceState(instanceId, pubId)) ?? {};
		let evaluator = expect(
			instanceState[user.id],
			`User was not invited to evaluate pub ${pubId}`
		);
		assertIsInvited(evaluator);
		await sendRequestedInfoNotification(instanceId, instanceConfig, pubId, evaluator);
		return { success: true };
	} catch (error) {
		return { error: error.message };
	}
};
