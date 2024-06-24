"use server";

import { defineServerAction } from "~/lib/server/defineServerAction";

export const createToken = defineServerAction(async function createToken() {
	return {};
});
