"use server";

import { revalidatePath } from "next/cache";

import { SuggestedMembersQuery } from "@pubpub/sdk";
import { expect } from "utils";

import {
	scheduleInvitationReminderEmail,
	scheduleNoReplyNotificationEmail,
	sendInviteEmail,
	unscheduleAllDeadlineReminderEmails,
	unscheduleAllManagerEmails,
} from "~/lib/emails";
import { getInstanceConfig, getInstanceState, setInstanceState } from "~/lib/instance";
import { client } from "~/lib/pubpub";
import { cookie } from "~/lib/request";
import {
	assertHasAccepted,
	assertIsInvited,
	EvaluatorWhoAccepted,
	EvaluatorWithInvite,
	isInvited,
} from "~/lib/types";
import { InviteFormEvaluator } from "./types";
import { captureException, withServerActionInstrumentation } from "@sentry/nextjs";
import { headers } from "next/headers";

export const save = async (
	instanceId: string,
	submissionPubId: string,
	evaluators: InviteFormEvaluator[],
	send: boolean
) => {
	return withServerActionInstrumentation(
		"manage/save",
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
				const evaluatorUserIds = new Set<string>();
				for (let i = 0; i < evaluators.length; i++) {
					let evaluator = evaluators[i];
					// Invited evaluators are read-only and already persisted, so we can skip
					// them.
					if (isInvited(evaluator)) {
						// We still need to add the userId to the set so we can check for
						// duplicates. We don't need to check, however, because the invite
						// should already be unique.
						evaluatorUserIds.add(evaluator.userId);
						continue;
					}
					// Find or create a PubPub user for the evaluator.
					const evaluatorUser = await client.getOrCreateUser(instanceId, evaluator);
					// If the user has already been saved or invited, halt and notify the
					// user.
					if (evaluatorUserIds.has(evaluatorUser.id)) {
						const { firstName, lastName } = evaluator;
						const name = `${firstName}${lastName ? ` ${lastName}` : ""}`;
						return {
							error: `${name} was added more than once.`,
						};
					}
					// Update the evaluator to reflect that they have been persisted.
					evaluator = {
						...evaluator,
						userId: evaluatorUser.id,
						firstName: evaluatorUser.firstName,
						lastName: evaluatorUser.lastName ?? undefined,
						status: "saved",
					};
					// If the user intends to invite selected evaluators, send an email to
					// the evaluator with the invite link.
					if (send && evaluator.selected) {
						// Update the evaluator to reflect that they have been invited.
						evaluator = {
							...evaluator,
							status: "invited",
							invitedAt: new Date().toString(),
							invitedBy: user.id,
						};
						// Immediately send the invite email.
						await sendInviteEmail(instanceId, submissionPubId, evaluator);
						// Scehdule a reminder email to person who was invited to evaluate.
						await scheduleInvitationReminderEmail(
							instanceId,
							instanceConfig,
							submissionPubId,
							evaluator
						);
						// Schedule no-reply notification email to person who invited the
						// evaluator.
						await scheduleNoReplyNotificationEmail(
							instanceId,
							instanceConfig,
							submissionPubId,
							evaluator,
							submissionPub.assignee
						);
					}
					// Remove the form's selected property from the evaluator before
					// persisting.
					const { selected, ...rest } = evaluator;
					instanceState[evaluator.userId] = rest;
					// Add the user id to the set so we can check for duplicates.
					evaluatorUserIds.add(evaluatorUser.id);
				}
				// Persist the updated instance state.
				await setInstanceState(instanceId, submissionPubId, instanceState);
				// Reload the page to reflect the changes.
				revalidatePath("/");
				return { success: true };
			} catch (error) {
				captureException(error);
				return { error: error.message };
			}
		}
	);
};

export const suggest = async (instanceId: string, query: SuggestedMembersQuery) => {
	return withServerActionInstrumentation(
		"manage/suggest",
		{
			headers: headers(),
		},
		async () => {
			try {
				const users = await client.getSuggestedMembers(instanceId, query);
				return users;
			} catch (error) {
				captureException(error);
				return { error: error.message };
			}
		}
	);
};

export const remove = async (instanceId: string, pubId: string, userId: string) => {
	return withServerActionInstrumentation(
		"manage/remove",
		{
			headers: headers(),
		},
		async () => {
			try {
				const instanceConfig = expect(
					await getInstanceConfig(instanceId),
					"Instance not configured"
				);
				const instanceState = await getInstanceState(instanceId, pubId);
				const pub = await client.getPub(instanceId, pubId);
				const evaluation = pub.children.find(
					(child) => child.values[instanceConfig.evaluatorFieldSlug] === userId
				);

				if (evaluation !== undefined) {
					await client.deletePub(instanceId, evaluation.id);
				}
				if (instanceState !== undefined) {
					let evaluator = expect(
						instanceState[userId],
						`User was not invited to evaluate pub ${pubId}`
					);
					assertHasAccepted(evaluator);
					await unscheduleAllDeadlineReminderEmails(instanceId, pubId, evaluator);
					await unscheduleAllManagerEmails(instanceId, pubId, evaluator);
					delete instanceState[userId];
					await setInstanceState(instanceId, pubId, instanceState);
				}

				return { success: true };
			} catch (error) {
				captureException(error);
				return { error: error.message };
			}
		}
	);
};
