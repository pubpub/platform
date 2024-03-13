"use server";

import { redirect } from "next/navigation";
import { expect } from "utils";
import {
	calculateDeadline,
	scheduleEvaluationReminderEmail,
	scheduleFinalEvaluationReminderEmail,
	scheduleFinalPromptEvalBonusReminderEmail,
	scheduleFollowUpToFinalEvaluationReminderEmail,
	scheduleNoSubmitNotificationEmail,
	schedulePromptEvalBonusReminderEmail,
	sendAcceptedEmail,
	sendAcceptedNotificationEmail,
	sendDeclinedNotificationEmail,
	sendNoticeOfNoSubmitEmail,
	sendRequestedInfoNotification,
	unscheduleInvitationReminderEmail,
	unscheduleNoReplyNotificationEmail,
} from "~/lib/emails";
import { getInstanceConfig, getInstanceState, setInstanceState } from "~/lib/instance";
import { cookie } from "~/lib/request";
import { assertIsInvited } from "~/lib/types";

export const accept = async (instanceId: string, pubId: string) => {
	const redirectParams = `?token=${cookie("token")}&instanceId=${instanceId}&pubId=${pubId}`;
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
			return {
				success: false,
				message: "You have already accepted this invitation",
			};
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
		const deadline = calculateDeadline(
			{
				deadlineLength: instanceConfig.deadlineLength,
				deadlineUnit: instanceConfig.deadlineUnit,
			},
			new Date(evaluator.acceptedAt)
		);
		evaluator.deadline = deadline;
		await setInstanceState(instanceId, pubId, instanceState);
		// Unschedule reminder email to evaluator.
		await unscheduleInvitationReminderEmail(instanceId, pubId, evaluator);
		// Unschedule no-reply notification email to community manager.
		await unscheduleNoReplyNotificationEmail(instanceId, pubId, evaluator);
		// Immediately send accepted notification email to community manager.
		await sendAcceptedNotificationEmail(instanceId, instanceConfig, pubId, evaluator);
		// Immediately send accepted email to evaluator.
		await sendAcceptedEmail(instanceId, instanceConfig, pubId, evaluator);
		// Schedule no-submit notification email to community manager.
		await scheduleNoSubmitNotificationEmail(instanceId, instanceConfig, pubId, evaluator);

		// schedule prompt evaluation email to evaluator.
		await schedulePromptEvalBonusReminderEmail(instanceId, instanceConfig, pubId, evaluator);
		//schedule final prompt eval email to evaluator
		await scheduleFinalPromptEvalBonusReminderEmail(
			instanceId,
			instanceConfig,
			pubId,
			evaluator
		);
		//schedule eval reminder email to evaluator
		await scheduleEvaluationReminderEmail(instanceId, instanceConfig, pubId, evaluator);
		//schedule final eval reminder email to evaluator
		await scheduleFinalEvaluationReminderEmail(instanceId, instanceConfig, pubId, evaluator);
		//schedule follow up to final eval reminder email to evaluator
		await scheduleFollowUpToFinalEvaluationReminderEmail(
			instanceId,
			instanceConfig,
			pubId,
			evaluator
		);
		// schedule no-submit notification email to evalutaor
		await sendNoticeOfNoSubmitEmail(instanceId, instanceConfig, pubId, evaluator);
	} catch (error) {
		return { error: error.message };
	}
	redirect(`/actions/respond/accepted${redirectParams}`);
};

export const decline = async (instanceId: string, pubId: string) => {
	const redirectParams = `?token=${cookie("token")}&instanceId=${instanceId}&pubId=${pubId}`;
	try {
		const user = JSON.parse(expect(cookie("user")));
		const instanceConfig = expect(
			await getInstanceConfig(instanceId),
			"Instance not configured"
		);
		const instanceState = (await getInstanceState(instanceId, pubId)) ?? {};
		let evaluator = expect(instanceState[user.id], "User was not invited to evaluate this pub");
		// Declining again is a no-op.
		if (evaluator.status !== "declined") {
			// Assert the user is invited to evaluate this pub.
			assertIsInvited(evaluator);
			// Update the evaluator's status to declined.
			evaluator = instanceState[user.id] = { ...evaluator, status: "declined" };
			await setInstanceState(instanceId, pubId, instanceState);
			// Unschedule reminder email.
			await unscheduleInvitationReminderEmail(instanceId, pubId, evaluator);
			// Unschedule no-reply notification email.
			await unscheduleNoReplyNotificationEmail(instanceId, pubId, evaluator);
			// Immediately send declined notification email.
			await sendDeclinedNotificationEmail(instanceId, instanceConfig, pubId, evaluator);
		}
	} catch (error) {
		return { error: error.message };
	}
	redirect(`/actions/respond/declined${redirectParams}`);
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
