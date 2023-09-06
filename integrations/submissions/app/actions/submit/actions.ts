"use server";

import { makeClient } from "@pubpub/sdk";
import manifest from "pubpub-integration.json";

const client = makeClient(manifest);

export async function create(form: FormData) {
	try {
		const { "instance-id": instanceId, ...pub } = Object.fromEntries(form);
		await client.create(instanceId, pub);
		return { message: "Success!" };
	} catch (e) {
		return { message: e.message };
	}
}
