"use server";

import type { z } from "zod";

import { revalidatePath } from "next/cache";

import type { UsersId } from "db/public/Users";

import type { userInfoFormSchema } from "./UserInfoForm";
import { db } from "~/kysely/database";
import { getLoginData } from "~/lib/auth/loginData";
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
		const result = await db
			.updateTable("users")
			.set({
				firstName,
				lastName,
				email,
				avatar,
			})
			.where("id", "=", data.id as UsersId)
			.execute();

		revalidatePath("/settings");
		return { success: true };
	} catch (error) {
		return { error: error.message };
	}
});
