"use server";

import { GetPubResponseBody, SuggestedMembersQuery } from "@pubpub/sdk";
import { revalidatePath } from "next/cache";
import {
	InviteStatus,
	getInstanceConfig,
	getInstanceState,
	setInstanceState,
} from "~/lib/instance";
import { client } from "~/lib/pubpub";
import { EvaluatorInvite } from "./types";
import { expect } from "utils";

const makeInviteJobKey = (instanceId: string, pubId: string, userId: string) =>
	`${instanceId}:${pubId}:${userId}`;

export const save = async (
	instanceId: string,
	pubId: string,
	pubTitle: string,
	invites: EvaluatorInvite[]
) => {
	try {
		const instanceConfig = expect(
			await getInstanceConfig(instanceId),
			"Instance not configured"
		);
		const instanceState = (await getInstanceState(instanceId, pubId)) ?? {};
		const pub = await client.getPub(instanceId, pubId);
		// Evaluations are created for each evaluator immediately when the form is
		// saved.
		const evaluations = pub.children.filter(
			(child) => child.pubTypeId === instanceConfig.pubTypeId
		);
		const evaluationsByEvaluator = evaluations.reduce((acc, evaluation) => {
			acc[evaluation.values[instanceConfig.evaluatorFieldSlug] as string] = evaluation;
			return acc;
		}, {} as Record<string, GetPubResponseBody>);
		for (let i = 0; i < invites.length; i++) {
			let invite = invites[i];
			// Invites either have an `email` or `userId` property. If they have a
			// `userId`, a Pub has already been created for the evaluator.
			if ("email" in invite) {
				const user = await client.getOrCreateUser(instanceId, invite);
				invite = {
					userId: user.id,
					firstName: invite.firstName,
					lastName: invite.lastName,
					template: invite.template,
				};
			}
			// If the invite was selected, we create an evaluation Pub for the
			// evaluator which will store their evaluation and display statuses
			// in core.
			if (invite.selected) {
				// If an evaluation hasn't been created for the evaluator, create it.
				const evaluation = evaluationsByEvaluator[invite.userId];
				if (evaluation === undefined) {
					await client.createPub(instanceId, {
						parentId: pubId,
						pubTypeId: instanceConfig.pubTypeId,
						values: {
							[instanceConfig.titleFieldSlug]: `Evaluation of ${pubTitle} by ${invite.firstName} ${invite.lastName}`,
							[instanceConfig.evaluatorFieldSlug]: invite.userId,
						},
					});
				}
				// Send an email to the evaluator with the default email template (or
				// personalized template) that should contain the invite links.
				await client.sendEmail(instanceId, {
					to: {
						userId: invite.userId,
					},
					subject: invite.template.subject,
					message: invite.template.message,
					extra: {
						invite_link: `<a href="{{instance.actions.evaluate}}?instanceId={{instance.id}}&pubId=${pubId}&token={{user.token}}">${pubTitle}</a>`,
					},
				});
				// Save updated email template and invite time.
				instanceState[invite.userId] = {
					status: InviteStatus.Invited,
					inviteTemplate: invite.template,
					inviteTime: new Date().toString(),
				};
			}
		}
		await setInstanceState(instanceId, pubId, instanceState);
		revalidatePath("/");
		return { success: true };
	} catch (error) {
		return { error: error.message };
	}
};

export const suggest = async (instanceId: string, query: SuggestedMembersQuery) => {
	try {
		const suggestions = await client.getSuggestedMembers(instanceId, query);
		return suggestions;
	} catch (error) {
		return { error: error.message };
	}
};

export const remove = async (instanceId: string, pubId: string, userId: string) => {
	try {
		const config = expect(await getInstanceConfig(instanceId), "Instance not configured");
		const state = await getInstanceState(instanceId, pubId);
		const submission = await client.getPub(instanceId, pubId);
		const evaluation = submission.children.find(
			(child) => child.values[config.evaluatorFieldSlug] === userId
		);
		if (evaluation !== undefined) {
			await client.deletePub(instanceId, evaluation.id);
		}
		if (state !== undefined) {
			const { [userId]: _, ...instanceStateWithoutEvaluator } = state;
			setInstanceState(instanceId, pubId, instanceStateWithoutEvaluator);
		}
		await client.unscheduleEmail(instanceId, makeInviteJobKey(instanceId, pubId, userId));
		revalidatePath("/");
		return { success: true };
	} catch (error) {
		return { error: error.message };
	}
};
