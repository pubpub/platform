"use server";

import { getSuggestedMembers } from "~/lib/server";

export const suggest = async (email?: string) => {
	try {
		const users = await getSuggestedMembers(email);
		return users;
	} catch (error) {
		return { error: error.message };
	}
};
