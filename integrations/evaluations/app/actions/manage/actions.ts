"use server";

import { GetPubResponseBody, SuggestedMembersQuery } from "@pubpub/sdk";
import { revalidatePath } from "next/cache";
import { expect } from "utils";
import { getInstanceConfig, getInstanceState, setInstanceState } from "~/lib/instance";
import { client } from "~/lib/pubpub";
import { InviteFormEvaluator } from "./types";
import { hasInvite } from "~/lib/types";

export const save = async (
	instanceId: string,
	pubId: string,
	pubTitle: string,
	evaluators: InviteFormEvaluator[],
	send: boolean
) => {
	try {
		const instanceState = (await getInstanceState(instanceId, pubId)) ?? {};
		for (let i = 0; i < evaluators.length; i++) {
			let evaluator = evaluators[i];
			if (!hasInvite(evaluator)) {
				const user = await client.getOrCreateUser(instanceId, evaluator);
				evaluator = {
					...evaluator,
					userId: user.id,
					status: "saved",
				};
			}
			if (send && evaluator.selected && !hasInvite(evaluator)) {
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
				evaluator = {
					...evaluator,
					status: "invited",
					invitedAt: new Date().toString(),
				};
			}
			const { selected, ...rest } = evaluator;
			instanceState[evaluator.userId] = rest;
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
