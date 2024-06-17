"use server";

import type { z } from "zod";

import { revalidatePath } from "next/cache";

import type { userInfoFormSchema } from "./UserInfoForm";
import type { UsersId } from "~/kysely/types/public/Users";
import { db } from "~/kysely/database";
import { getLoginData } from "~/lib/auth/loginData";
import { revalidateTagForCommunity } from "~/lib/server/cache/revalidate";
import { defineServerAction } from "~/lib/server/defineServerAction";

export const updateUserInfo = defineServerAction(async function updateUserInfo({
	data,
}: {
	data: z.infer<typeof userInfoFormSchema>;
}) {
	const loginData = await getLoginData();
	if (!loginData) {
		return { error: "You must be logged in to update your user information" };
	}

	if (loginData.id !== data.id && !loginData.isSuperAdmin) {
		return { error: "You must the user to update their information" };
	}

	const { firstName, lastName, email, avatar } = data;
	try {
		// since a user is one of the few entities that exist cross-community,
		// we need to manually invalidate all the communities they are a part of
		const communitySlugs = await db
			.with("userCommunitieSlugs", (db) =>
				// it's also not a good idea to cache this query
				// as, again, this query sits outside of the community scope
				// and thus is hard to invalidate using only community scoped tags
				// as we would need to know the result of this query in order to tag it
				// properly, which is obviously impossible
				db
					.selectFrom("members")
					.where("userId", "=", data.id as UsersId)
					.innerJoin("communities", "members.communityId", "communities.id")
					.select(["communities.slug"])
			)
			.with("updatedUser", (db) =>
				db
					.updateTable("users")
					.set({
						firstName,
						lastName,
						email,
						avatar,
					})
					.where("id", "=", data.id as UsersId)
			)
			.selectFrom("userCommunitieSlugs")
			.select("userCommunitieSlugs.slug")
			.execute();

		communitySlugs.forEach(({ slug }) => revalidateTagForCommunity("users", slug));

		revalidatePath("/settings");
		return { success: true };
	} catch (error) {
		return { error: error.message };
	}
});
