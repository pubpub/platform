"use server";

import { assert } from "utils";
import { findInstance } from "~/lib/instance";
import { makePubFromDoi, makePubFromTitle, makePubFromUrl } from "~/lib/metadata";
import { client } from "~/lib/pubpub";

export const manage = async (instanceId: string, pubId: string, email: Create<typeof client>) => {
	try {
		console.log(`Instance: ${instanceId}, pubId: ${pubId}, email: ${email}`);
		return {};
	} catch (error) {
		return { error: error.message };
	}
};
