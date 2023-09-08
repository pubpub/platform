"use server";

import { Pub } from "@pubpub/sdk";
import manifest from "pubpub-integration.json";
import { assert, expect } from "utils";
import { client } from "~/lib/pubpub";
import { findInstance } from "~/lib/instance";

export async function submit(instanceId: string, pub: Pub<typeof manifest>) {
	try {
		assert(typeof instanceId === "string");
		const instance = expect(await findInstance(instanceId));
		return client.create(instanceId, pub as Pub<typeof manifest>, instance.pubTypeId);
	} catch (error) {
		return { error: error.message };
	}
}
