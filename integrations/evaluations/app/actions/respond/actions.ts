"use server";

import { captureException, withServerActionInstrumentation } from "@sentry/nextjs";
import { isRedirectError } from "next/dist/client/components/redirect";
import { headers } from "next/headers";
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
	unscheduleInvitationReminderEmail,
	unscheduleNoReplyNotificationEmail,
} from "~/lib/emails";
import { getInstanceConfig, getInstanceState, setInstanceState } from "~/lib/instance";
import { client } from "~/lib/pubpub";
import { cookie } from "~/lib/request";
import { assertIsInvited } from "~/lib/types";

type ErrorResult = {
	error: string;
};

export const accept = async (
	instanceId: string,
	submissionPubId: string
): Promise<ErrorResult | undefined> => {
	return withServerActionInstrumentation(
		"respond/accept",
		{
			headers: headers(),
		},
		async () => {
			try {
				const submissionPub = await client.getPub(instanceId, submissionPubId);
				const user = JSON.parse(expect(cookie("user")));
				const instanceConfig = expect(
					await getInstanceConfig(instanceId),
					"Instance not configured"
				);
				const instanceState = (await getInstanceState(instanceId, submissionPubId)) ?? {};
				let evaluator = expect(
					instanceState[user.id],
					`User was not invited to evaluate pub ${submissionPubId}`
				);
				const hasAlreadyAccepted =
					evaluator.status === "accepted" || evaluator.status === "received";
				// Accepting more than one time is a no-op.
				if (!hasAlreadyAccepted) {
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
						instanceConfig,
						new Date(evaluator.acceptedAt)
					);
					evaluator.deadline = deadline;
					await setInstanceState(instanceId, submissionPubId, instanceState);
					// Unschedule reminder email to evaluator.
					await unscheduleInvitationReminderEmail(instanceId, submissionPubId, evaluator);
					// Unschedule no-reply notification email to community manager.
					await unscheduleNoReplyNotificationEmail(
						instanceId,
						submissionPubId,
						evaluator
					);
					// Immediately send accepted notification email to community manager.
					await sendAcceptedNotificationEmail(
						instanceId,
						instanceConfig,
						submissionPubId,
						evaluator,
						submissionPub.assignee
					);
					// Immediately send accepted email to evaluator.
					await sendAcceptedEmail(instanceId, instanceConfig, submissionPubId, evaluator);
					// Schedule no-submit notification email to community manager.
					await scheduleNoSubmitNotificationEmail(
						instanceId,
						instanceConfig,
						submissionPubId,
						evaluator,
						submissionPub.assignee
					);

					// schedule prompt evaluation email to evaluator.
					await schedulePromptEvalBonusReminderEmail(
						instanceId,
						instanceConfig,
						submissionPubId,
						evaluator
					);
					//schedule final prompt eval email to evaluator
					await scheduleFinalPromptEvalBonusReminderEmail(
						instanceId,
						instanceConfig,
						submissionPubId,
						evaluator
					);
					//schedule eval reminder email to evaluator
					await scheduleEvaluationReminderEmail(
						instanceId,
						instanceConfig,
						submissionPubId,
						evaluator
					);
					//schedule final eval reminder email to evaluator
					await scheduleFinalEvaluationReminderEmail(
						instanceId,
						instanceConfig,
						submissionPubId,
						evaluator
					);
					//schedule follow up to final eval reminder email to evaluator
					await scheduleFollowUpToFinalEvaluationReminderEmail(
						instanceId,
						instanceConfig,
						submissionPubId,
						evaluator
					);
					// schedule no-submit notification email to evalutaor
					await sendNoticeOfNoSubmitEmail(
						instanceId,
						instanceConfig,
						submissionPubId,
						evaluator
					);
				}
			} catch (error) {
				captureException(error);
				return { error: error.message };
			}
			redirect(
				`/actions/respond/accepted?token=${cookie(
					"token"
				)}&instanceId=${instanceId}&pubId=${submissionPubId}`
			);
		}
	);
};

export const decline = async (
	instanceId: string,
	submissionPubId: string
): Promise<ErrorResult | undefined> => {
	return withServerActionInstrumentation(
		"evaluations/respond/decline",
		{
			headers: headers(),
		},
		async () => {
			const redirectParams = `?token=${cookie(
				"token"
			)}&instanceId=${instanceId}&pubId=${submissionPubId}`;
			try {
				const submissionPub = await client.getPub(instanceId, submissionPubId);
				const user = JSON.parse(expect(cookie("user")));
				const instanceConfig = expect(
					await getInstanceConfig(instanceId),
					"Instance not configured"
				);
				const instanceState = (await getInstanceState(instanceId, submissionPubId)) ?? {};
				let evaluator = expect(
					instanceState[user.id],
					"User was not invited to evaluate this pub"
				);
				// Declining again is a no-op.
				if (evaluator.status !== "declined") {
					// Assert the user is invited to evaluate this pub.
					assertIsInvited(evaluator);
					// Update the evaluator's status to declined.
					evaluator = instanceState[user.id] = { ...evaluator, status: "declined" };
					await setInstanceState(instanceId, submissionPubId, instanceState);
					// Unschedule reminder email.
					await unscheduleInvitationReminderEmail(instanceId, submissionPubId, evaluator);
					// Unschedule no-reply notification email.
					await unscheduleNoReplyNotificationEmail(
						instanceId,
						submissionPubId,
						evaluator
					);
					// Immediately send declined notification email.
					await sendDeclinedNotificationEmail(
						instanceId,
						instanceConfig,
						submissionPubId,
						evaluator,
						submissionPub.assignee
					);
				}
			} catch (error) {
				captureException(error);
				return { error: error.message };
			}
			redirect(`/actions/respond/declined${redirectParams}`);
		}
	);
};
