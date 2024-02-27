"use server";

import { SuggestedMembersQuery } from "@pubpub/sdk";
import { revalidatePath } from "next/cache";
import { expect } from "utils";
import { getInstanceConfig, getInstanceState, setInstanceState } from "~/lib/instance";
import { client } from "~/lib/pubpub";
import { cookie } from "~/lib/request";
import { EvaluatorWhoAccepted, EvaluatorWithInvite, isInvited } from "~/lib/types";
import {
	scheduleInvitationReminderEmail,
	scheduleNoReplyNotificationEmail,
	sendInviteEmail,
	unscheduleAllDeadlineReminderEmails,
	unscheduleAllManagerEmails,
} from "~/lib/emails";
import { InviteFormEvaluator } from "./types";

export const save = async (
	instanceId: string,
	pubId: string,
	evaluators: InviteFormEvaluator[],
	send: boolean
) => {
	try {
		const user = JSON.parse(expect(cookie("user")));
		const instanceConfig = expect(
			await getInstanceConfig(instanceId),
			"Instance not configured"
		);
		const instanceState = (await getInstanceState(instanceId, pubId)) ?? {};
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
				await sendInviteEmail(instanceId, pubId, evaluator);
				// Scehdule a reminder email to person who was invited to evaluate.
				await scheduleInvitationReminderEmail(instanceId, instanceConfig, pubId, evaluator);
				// Schedule no-reply notification email to person who invited the
				// evaluator.
				await scheduleNoReplyNotificationEmail(
					instanceId,
					instanceConfig,
					pubId,
					evaluator
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
		await setInstanceState(instanceId, pubId, instanceState);
		// Reload the page to reflect the changes.
		revalidatePath("/");
		return { success: true };
	} catch (error) {
		return { error: error.message };
	}
};

export const suggest = async (instanceId: string, query: SuggestedMembersQuery) => {
	try {
		const users = await client.getSuggestedMembers(instanceId, query);
		return users;
	} catch (error) {
		return { error: error.message };
	}
};

export const remove = async (instanceId: string, pubId: string, userId: string) => {
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
		await unscheduleAllDeadlineReminderEmails(instanceId, pubId, {
			userId,
		} as EvaluatorWhoAccepted);
		await unscheduleAllManagerEmails(instanceId, pubId, { userId } as EvaluatorWithInvite);
		// TODO: When an evaluator is removed, we should unschedule reminder
		// email and notification email(s).
		if (evaluation !== undefined) {
			await client.deletePub(instanceId, evaluation.id);
		}
		if (instanceState !== undefined) {
			delete instanceState[userId];
			await setInstanceState(instanceId, pubId, instanceState);
		}

		return { success: true };
	} catch (error) {
		return { error: error.message };
	}
};
