"use server";

import { revalidatePath } from "next/cache";
import { getPathname } from "@nimpl/getters/get-pathname";

import { getLoginData } from "~/lib/authentication/loginData";

export const revalidateCurrentPath = async () => {
	const { user } = await getLoginData();
	if (!user) {
		return;
	}

	const path = getPathname();
	console.log(path);
	if (!path) {
		return;
	}

	revalidatePath(path);
};
