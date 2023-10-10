"use server";

import { SuggestedMembersQuery } from "@pubpub/sdk";
import { findInstance } from "~/lib/instance";
import { client } from "~/lib/pubpub";

export type EvaluatorInvite = {
	email: string;
	firstName: string;
	lastName: string;
	template: {
		subject: string;
		message: string;
	};
};

const makeEvaluatorInviteKey = (instanceId: string, pubId: string, email: string) => {
	return `${instanceId}-${pubId}-invite-${email}`;
};

export const manage = async (
	instanceId: string,
	pubId: string,
	pubTitle: string,
	invites: EvaluatorInvite[]
) => {
	const instance = await findInstance(instanceId);
	if (instance === undefined) {
		return { error: `No instance found with id ${instanceId}` };
	}
	const pub = await client.getPub(instanceId, pubId);
	const pubEvaluations = pub.children.filter((child) => child.pubTypeId === instance.pubTypeId);
	const pubEvaluationsByInviteKey = pubEvaluations.reduce((acc, evaluation) => {
		const inviteKey = makeEvaluatorInviteKey(
			instanceId,
			pubId,
			(evaluation.values["unjournal:submission-evaluator"] as EvaluatorInvite).email
		);
		acc[inviteKey] = evaluation;
		return acc;
	}, {} as Record<string, any>);
	for (const invite of invites) {
		const inviteKey = makeEvaluatorInviteKey(instanceId, pubId, invite.email);
		const existingEvaluation = pubEvaluationsByInviteKey[inviteKey];
		if (existingEvaluation === undefined) {
			const evaluation = await client.createPub(instanceId, {
				parentId: pubId,
				pubTypeId: instance.pubTypeId,
				values: {
					"unjournal:title": `Evaluation of ${pubTitle} by ${invite.firstName} ${invite.lastName}`,
					"unjournal:submission-evaluator": invite,
				},
			});
			const info = await client.scheduleEmail(
				instanceId,
				{
					to: {
						firstName: invite.firstName,
						lastName: invite.lastName,
						email: invite.email,
					},
					subject:
						invite.template.subject ??
						"You've been invited to review a submission on PubPub",
					message:
						invite.template.message ??
						`Hello {{user.firstName}} {{user.lastName}}! You've been invited to evaluate <a href="{{instance.actions.evaluate}}?instanceId={{instance.id}}&pubId=${pubId}&token={{user.token}}">${pubTitle}</a> on PubPub.`,
				},
				{
					key: inviteKey,
					runAt: new Date(),
				}
			);
			return info;
		} else {
			await client.updatePub(instanceId, {
				id: existingEvaluation.id,
				pubTypeId: instance.pubTypeId,
				values: {
					"unjournal:submission-evaluator": invite,
				},
				children: [],
			});
		}
	}
	try {
		// const info = await client.scheduleEmail(
		// 	instanceId,
		// 	{
		// 		to: {
		// 			firstName,
		// 			lastName,
		// 			email,
		// 		},
		// 		subject: template.subject ?? "You've been invited to review a submission on PubPub",
		// 		message:
		// 			template.message ??
		// 			`Hello {{user.firstName}} {{user.lastName}}! You've been invited to evaluate <a href="{{instance.actions.evaluate}}?instanceId={{instance.id}}&pubId=${pubId}&token={{user.token}}">${pubTitle}</a> on PubPub.`,
		// 	},
		// 	{
		// 		key: `${instanceId}-${pubId}-invite-${email}`,
		// 		runAt: new Date(),
		// 	}
		// );
		// return info;
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
