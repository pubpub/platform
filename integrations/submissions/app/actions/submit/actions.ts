"use server";

import { Pub } from "@pubpub/sdk";
import manifest from "pubpub-integration.json";
import { assert, expect } from "utils";
import { client } from "~/lib/pubpub";
import { findInstance } from "~/lib/instance";

export async function submit(form: FormData, token: string) {
	try {
		const { "instance-id": instanceId, ...pub } = Object.fromEntries(form);
		assert(typeof instanceId === "string");
		const instance = expect(await findInstance(instanceId));
		return client.create(instanceId, token, pub as Pub<typeof manifest>, instance.pubTypeId);
	} catch (error) {
		return { error: error.message };
	}
}
