"use server";

import { GetPubResponseBody, SuggestedMembersQuery } from "@pubpub/sdk";
import { getInstanceConfig, getInstanceState, setInstanceState } from "~/lib/instance";
import { client } from "~/lib/pubpub";

export type Evaluator =
	| { userId: string; firstName: string; lastName: string }
	| { email: string; firstName: string; lastName: string };

export type EvaluatorInvite = Evaluator & {
	template: {
		subject: string;
		message: string;
	};
};

const makeInviteJobKey = (instanceId: string, pubId: string, userId: string) =>
	`${instanceId}:${pubId}:${userId}`;

export const manage = async (
	instanceId: string,
	pubId: string,
	pubTitle: string,
	invites: EvaluatorInvite[]
) => {
	const instanceConfig = await getInstanceConfig(instanceId);
	if (instanceConfig === undefined) {
		return { error: `No instance found with id ${instanceId}` };
	}

	try {
		const pub = await client.getPub(instanceId, pubId);
		const state = await getInstanceState(instanceId, pubId);
		const evaluations = pub.children.filter(
			(child) => child.pubTypeId === instanceConfig.pubTypeId
		);
		const evaluationsByEvaluator = evaluations.reduce((acc, evaluation) => {
			acc[evaluation.values["unjournal:evaluator"] as string] = evaluation;
			return acc;
		}, {} as Record<string, GetPubResponseBody>);
		// { "user-abc-123": Evaluation, "user-def-456": Evaluation, ... }

		for (let i = 0; i < invites.length; i++) {
			let invite = invites[i];
			if ("email" in invite) {
				const user = await client.getOrCreateUser(instanceId, invite);
				invite = invites[i] = {
					userId: user.id,
					firstName: invite.firstName,
					lastName: invite.lastName,
					template: invite.template,
				};
			}
			// Save email template
			await setInstanceState(instanceId, pubId, {
				...state,
				[invite.userId]: invite.template,
			});
			const evaluation = evaluationsByEvaluator[invite.userId];
			if (evaluation === undefined) {
				// New evaluator added. Make the corresponding evaluation pub.
				await client.createPub(instanceId, {
					parentId: pubId,
					pubTypeId: instanceConfig.pubTypeId,
					values: {
						"unjournal:title": `Evaluation of ${pubTitle} by ${invite.firstName} ${invite.lastName}`,
						"unjournal:evaluator": invite.userId,
					},
				});
			}
			// Schedule (or replace) email to be sent to evaluator
			await client.scheduleEmail(
				instanceId,
				{
					to: {
						userId: invite.userId,
					},
					subject: invite.template.subject ?? instanceConfig.template.subject,
					message: invite.template.message ?? instanceConfig.template.message,
				},
				{
					key: makeInviteJobKey(instanceId, pubId, invite.userId),
					mode: "preserve_run_at",
					runAt: new Date(),
				}
			);
		}
		return invites;
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
