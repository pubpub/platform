"use server";

import { GetPubResponseBody, SuggestedMembersQuery } from "@pubpub/sdk";
import { revalidatePath } from "next/cache";
import { expect } from "utils";
import { getInstanceConfig, getInstanceState, setInstanceState } from "~/lib/instance";
import { client } from "~/lib/pubpub";
import type { InviteFormEvaluator } from "./EvaluatorInviteForm";

const makeInviteJobKey = (instanceId: string, pubId: string, userId: string) =>
	`${instanceId}:${pubId}:${userId}`;

export const save = async (
	instanceId: string,
	pubId: string,
	pubTitle: string,
	evaluators: InviteFormEvaluator[]
) => {
	try {
		const instanceConfig = expect(
			await getInstanceConfig(instanceId),
			"Instance not configured"
		);
		const instanceState = (await getInstanceState(instanceId, pubId)) ?? {};
		const titleFieldSlug = expect(instanceConfig.titleFieldSlug, "Title field not configured");
		const evaluatorFieldSlug = expect(
			instanceConfig.evaluatorFieldSlug,
			"Evaluator field not configured"
		);
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
		for (let i = 0; i < evaluators.length; i++) {
			let evaluator = evaluators[i];
			// Invites either have an `email` or `userId` property. If they have a
			// `userId`, an account has already been created for the evaluator. If
			// not, we need to create them an account.
			if ("email" in evaluator) {
				const user = await client.getOrCreateUser(instanceId, evaluator);
				evaluator = {
					...evaluator,
					userId: user.id,
					status: "associated",
				};
			}
			// If the invite was selected, we create an evaluation Pub for the
			// evaluator which will store their evaluation and display statuses
			// in core.
			if (evaluator.selected) {
				// If an evaluation hasn't been created for the evaluator, create it.
				const evaluation = evaluationsByEvaluator[evaluator.userId];
				if (evaluation === undefined) {
					await client.createPub(instanceId, {
						parentId: pubId,
						pubTypeId: instanceConfig.pubTypeId,
						values: {
							[titleFieldSlug]: `Evaluation of ${pubTitle} by ${evaluator.firstName} ${evaluator.lastName}`,
							[evaluatorFieldSlug]: evaluator.userId,
						},
					});
				}
				// Send an email to the evaluator with the default email template (or
				// personalized template) that should contain the invite links.
				await client.sendEmail(instanceId, {
					to: {
						userId: evaluator.userId,
					},
					subject: evaluator.emailTemplate.subject,
					message: evaluator.emailTemplate.message,
					extra: {
						invite_link: `<a href="{{instance.actions.evaluate}}?instanceId={{instance.id}}&pubId=${pubId}&token={{user.token}}">${pubTitle}</a>`,
					},
				});
				// Save updated email template and invite time.
				instanceState[evaluator.userId] = {
					...evaluator,
					status: "invited",
					invitedAt: new Date().toString(),
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
			delete instanceState[userId];
			setInstanceState(instanceId, pubId, instanceState);
		}
		revalidatePath("/");
		return { success: true };
	} catch (error) {
		return { error: error.message };
	}
};
