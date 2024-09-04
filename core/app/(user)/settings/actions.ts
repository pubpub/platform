"use server";

import type { z } from "zod";

import { revalidatePath } from "next/cache";

import type { UsersId } from "db/public";

import type { userInfoFormSchema } from "./UserInfoForm";
import { db } from "~/kysely/database";
import { getLoginData } from "~/lib/auth/loginData";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { updateUser } from "~/lib/server/user";

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
		await updateUser({
			id: data.id as UsersId,
			firstName,
			lastName,
			email,
			avatar,
		});

		revalidatePath("/settings");
		return { success: true };
	} catch (error) {
		return { error: error.message };
	}
});
