"use server";

import { PubValues } from "@pubpub/sdk";
import { revalidatePath } from "next/cache";
import { expect } from "utils";
import { getInstanceConfig, getInstanceState, setInstanceState } from "~/lib/instance";
import { client } from "~/lib/pubpub";
import { assertIsInvited } from "~/lib/types";

export const accept = async (instanceId: string, pubId: string, userId: string) => {
	const state = (await getInstanceState(instanceId, pubId)) ?? {};
	const evaluator = expect(state[userId], `User was not invited to evaluate pub ${pubId}`);
	assertIsInvited(evaluator);
	state[userId] = { ...evaluator, status: "accepted" };
	await setInstanceState(instanceId, pubId, state);
	revalidatePath("/");
};

export const decline = async (instanceId: string, pubId: string, userId: string) => {
	const state = (await getInstanceState(instanceId, pubId)) ?? {};
	const evaluator = expect(state[userId], `User was not invited to evaluate pub ${pubId}`);
	assertIsInvited(evaluator);
	state[userId] = { ...evaluator, status: "declined" };
	await setInstanceState(instanceId, pubId, state);
	revalidatePath("/");
};

export const submit = async (instanceId: string, pubId: string, values: PubValues) => {
	const instance = await getInstanceConfig(instanceId);
	if (instance === undefined) {
		return { error: "Instance not configured" };
	}
	try {
		const pub = await client.createPub(instanceId, {
			pubTypeId: instance.config.pubTypeId,
			parentId: pubId,
			values: values,
		});
		return pub;
	} catch (error) {
		return { error: error.message };
	}
};
