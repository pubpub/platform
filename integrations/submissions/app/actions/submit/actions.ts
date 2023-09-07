"use server";

import { Pub, makeClient } from "@pubpub/sdk";
import { assert, expect } from "utils";
import manifest from "pubpub-integration.json";
import { findInstance } from "~/lib/instance";

const client = makeClient(manifest);

export async function submit(form: FormData) {
	try {
		const { "instance-id": instanceId, ...pub } = Object.fromEntries(form);
		assert(typeof instanceId === "string");
		const instance = expect(await findInstance(instanceId));
		return client.create(instanceId, pub as Pub<typeof manifest>, instance.pubTypeId);
	} catch (error) {
		return { error: error.message };
	}
}
