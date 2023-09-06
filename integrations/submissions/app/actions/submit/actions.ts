"use server";

import { makeClient } from "@pubpub/sdk";
import manifest from "pubpub-integration.json";
import { findInstance } from "~/lib/instance";

const client = makeClient(manifest);

export async function submit(form: FormData) {
	try {
		const { "instance-id": instanceId, ...pubFields } = Object.fromEntries(form);
		const instance = await findInstance(instanceId as string);
		await client.create(instanceId as string, pubFields as any, instance!.pubTypeId);
		return { message: "Success!" };
	} catch (e) {
		return { message: e.message, cause: e.cause };
	}
}
