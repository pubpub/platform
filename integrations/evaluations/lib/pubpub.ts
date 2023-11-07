import { Parse, makeClient } from "@pubpub/sdk";
import { headers } from "next/headers";
import manifest from "pubpub-integration.json";
import { expect } from "utils";

export const client = makeClient(<Parse<typeof manifest>>manifest);

export const getVisitingUser = async () => {
	const search = expect(headers().get("x-next-search"));
	const searchParams = new URLSearchParams(search);
	const instanceId = expect(searchParams.get("instanceId"));
	const token = expect(searchParams.get("token"));
	const user = await client.auth(instanceId, token);
	return user;
};
