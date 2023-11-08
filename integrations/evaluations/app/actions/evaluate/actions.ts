"use server";

import { PubValues } from "@pubpub/sdk";
import { revalidatePath } from "next/cache";
import { expect } from "utils";
import { getInstanceConfig, getInstanceState, setInstanceState } from "~/lib/instance";
import { client } from "~/lib/pubpub";
import { assertIsInvited } from "~/lib/types";

export const accept = async (instanceId: string, pubId: string, userId: string) => {
	const instanceState = (await getInstanceState(instanceId, pubId)) ?? {};
	const evaluator = expect(
		instanceState[userId],
		`User was not invited to evaluate pub ${pubId}`
	);
	assertIsInvited(evaluator);
	instanceState[userId] = { ...evaluator, status: "accepted" };
	await setInstanceState(instanceId, pubId, instanceState);
	revalidatePath("/");
};

export const decline = async (instanceId: string, pubId: string, userId: string) => {
	const instanceState = (await getInstanceState(instanceId, pubId)) ?? {};
	const evaluator = expect(
		instanceState[userId],
		`User was not invited to evaluate pub ${pubId}`
	);
	assertIsInvited(evaluator);
	instanceState[userId] = { ...evaluator, status: "declined" };
	await setInstanceState(instanceId, pubId, instanceState);
	revalidatePath("/");
};

export const submit = async (
	instanceId: string,
	pubId: string,
	userId: string,
	values: PubValues
) => {
	const instanceConfig = await getInstanceConfig(instanceId);
	const instanceState = (await getInstanceState(instanceId, pubId)) ?? {};
	if (instanceConfig === undefined) {
		return { error: "Instance not configured" };
	}
	const evaluator = expect(
		instanceState[userId],
		`User was not invited to evaluate pub ${pubId}`
	);
	assertIsInvited(evaluator);
	try {
		const pub = await client.createPub(instanceId, {
			pubTypeId: instanceConfig.pubTypeId,
			parentId: pubId,
			values: values,
		});
		instanceState[userId] = { ...evaluator, status: "received" };
		await setInstanceState(instanceId, pubId, instanceState);
		return pub;
	} catch (error) {
		return { error: error.message };
	}
};
