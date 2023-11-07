"use server";

import { PubValues } from "@pubpub/sdk";
import { expect } from "utils";
import { InviteStatus, getInstanceConfig, getInstanceState } from "~/lib/instance";
import { client } from "~/lib/pubpub";

export const accept = async (instanceId: string, pubId: string, userId: string) => {
	const state = (await getInstanceState(instanceId, pubId)) ?? {};
	const invite = expect(state[userId], `User was not invited to evaluate pub ${pubId}`);
	state[userId] = { ...invite, status: InviteStatus.Accepted };
};

export const decline = async (instanceId: string, pubId: string, userId: string) => {
	const state = (await getInstanceState(instanceId, pubId)) ?? {};
	const invite = expect(state[userId], `User was not invited to evaluate pub ${pubId}`);
	state[userId] = { ...invite, status: InviteStatus.Declined };
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
