"use server";

import { Create, Update } from "@pubpub/sdk";
import { assert } from "utils";
import { findInstance } from "~/lib/instance";
import { makePubFromDoi, makePubFromTitle, makePubFromUrl } from "~/lib/metadata";
import { client } from "~/lib/pubpub";

export const evaluate = async (instanceId: string) => {
	try {
		return {};
	} catch (error) {
		return { error: error.message };
	}
};
