"use server";

import type { z } from "zod";

import { revalidatePath } from "next/cache";

import type { UsersId } from "db/public";

import type { userInfoFormSchema } from "./UserInfoForm";
import { db } from "~/kysely/database";
import { getLoginData } from "~/lib/auth/loginData";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { defineServerAction } from "~/lib/server/defineServerAction";

export const updateUserInfo = defineServerAction(async function updateUserInfo({
	data,
}: {
	data: z.infer<typeof userInfoFormSchema>;
}) {
	const { user } = await getLoginData();
	if (!user) {
		return { error: "You must be logged in to update your user information" };
	}

	if (user.id !== data.id && !user.isSuperAdmin) {
		return { error: "You must be the user to update their information" };
	}

	const { firstName, lastName, email, avatar } = data;
	try {
		// since a user is one of the few entities that exist cross-community,
		// we need to manually invalidate all the communities they are a part of
		// it's also not a good idea to cache this query
		// as, again, this query sits outside of the community scope
		// and thus is hard to invalidate using only community scoped tags
		// as we would need to know the result of this query in order to tag it
		// properly, which is obviously impossible
		const communitySlugs = await db
			.selectFrom("members")
			.where("userId", "=", data.id as UsersId)
			.innerJoin("communities", "members.communityId", "communities.id")
			.select(["communities.slug"])
			.execute();

		await autoRevalidate(
			db
				.updateTable("users")
				.set({
					firstName,
					lastName,
					email,
					avatar,
				})
				.where("id", "=", data.id as UsersId),
			{
				communitySlug: communitySlugs.map((slug) => slug.slug),
			}
		).execute();

		revalidatePath("/settings");
		return { success: true };
	} catch (error) {
		return { error: error.message };
	}
});
