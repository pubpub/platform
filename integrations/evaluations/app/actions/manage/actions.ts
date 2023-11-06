"use server";

import { GetPubResponseBody, SuggestedMembersQuery } from "@pubpub/sdk";
import { revalidatePath } from "next/cache";
import { getInstanceConfig, getInstanceState, setInstanceState } from "~/lib/instance";
import { client } from "~/lib/pubpub";
import { EvaluatorInvite } from "./types";

const makeInviteJobKey = (instanceId: string, pubId: string, userId: string) =>
	`${instanceId}:${pubId}:${userId}`;

export const save = async (
	instanceId: string,
	pubId: string,
	pubTitle: string,
	invites: EvaluatorInvite[]
) => {
	try {
		const instanceState = (await getInstanceState(instanceId, pubId)) ?? {};
		const instanceConfig = await getInstanceConfig(instanceId);
		if (instanceConfig === undefined) {
			return { error: `No instance found with id ${instanceId}` };
		}
		const pub = await client.getPub(instanceId, pubId);
		const evaluations = pub.children.filter(
			(child) => child.pubTypeId === instanceConfig.config.pubTypeId
		);
		const evaluationsByEvaluator = evaluations.reduce((acc, evaluation) => {
			acc[evaluation.values["unjournal:evaluator"] as string] = evaluation;
			return acc;
		}, {} as Record<string, GetPubResponseBody>);
		for (let i = 0; i < invites.length; i++) {
			let invite = invites[i];
			if ("email" in invite) {
				const user = await client.getOrCreateUser(instanceId, invite);
				invite = {
					userId: user.id,
					firstName: invite.firstName,
					lastName: invite.lastName,
					template: invite.template,
				};
			}
			const evaluation = evaluationsByEvaluator[invite.userId];
			if (evaluation === undefined) {
				// New evaluator added. Make the corresponding evaluation pub.
				await client.createPub(instanceId, {
					parentId: pubId,
					pubTypeId: instanceConfig.config.pubTypeId,
					values: {
						"unjournal:title": `Evaluation of ${pubTitle} by ${invite.firstName} ${invite.lastName}`,
						"unjournal:evaluator": invite.userId,
					},
				});
			}
			// FIXME: This is added for demo purposes to show email scheduling. This
			// should instead be calcualated from instance configuration.
			const runAt = new Date();
			runAt.setMinutes(runAt.getMinutes() + i * 3);
			// Schedule (or replace) email to be sent to evaluator
			await client.scheduleEmail(
				instanceId,
				{
					to: {
						userId: invite.userId,
					},
					subject: invite.template.subject,
					message: invite.template.message,
					extra: {
						invite_link: `<a href="{{instance.actions.evaluate}}?instanceId={{instance.id}}&pubId=${pubId}&token={{user.token}}">${pubTitle}</a>`,
					},
				},
				{
					jobKey: makeInviteJobKey(instanceId, pubId, invite.userId),
					mode: "preserve_run_at",
					runAt,
				}
			);
			// Save updated email template and job run time
			instanceState.value[invite.userId] = {
				inviteTemplate: invite.template,
				inviteTime: instanceState.value[invite.userId]?.inviteTime ?? runAt.toString(),
			};
		}
		await setInstanceState(instanceId, pubId, instanceState.value);
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
		const instanceState = await getInstanceState(instanceId, pubId);
		const submission = await client.getPub(instanceId, pubId);
		const evaluation = submission.children.find(
			(child) => child.values["unjournal:evaluator"] === userId
		);
		if (evaluation !== undefined) {
			await client.deletePub(instanceId, evaluation.id);
		}
		if (instanceState !== undefined) {
			const { [userId]: _, ...instanceStateWithoutEvaluator } = instanceState.value;
			setInstanceState(instanceId, pubId, instanceStateWithoutEvaluator);
		}
		await client.unscheduleEmail(instanceId, makeInviteJobKey(instanceId, pubId, userId));
		revalidatePath("/");
		return { success: true };
	} catch (error) {
		return { error: error.message };
	}
};
