"use server";

import { cookies } from "next/headers";

import { defineServerAction } from "~/lib/server/defineServerAction";
import { LAST_VISITED_COOKIE } from "./constants";

export const setLastVisited = defineServerAction(async function setLastVisited(
	communitySlug: string
) {
	const cookieStore = await cookies();
	cookieStore.set(LAST_VISITED_COOKIE, communitySlug);
});
