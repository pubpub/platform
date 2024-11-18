import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { getPathname } from "@nimpl/getters/get-pathname";

import type { ExtraSessionValidationOptions } from "./lucia";
import { validateRequest } from "./lucia";

export const getLoginData = cache(async (opts?: ExtraSessionValidationOptions) => {
	return validateRequest(opts);
});

export const getPageLoginData = cache(async (opts?: ExtraSessionValidationOptions) => {
	const loginData = await getLoginData(opts);

	if (!loginData.user) {
		const pathname = getPathname();
		redirect(pathname ? `/login?redirectTo=${encodeURIComponent(pathname)}` : "/login");
	}

	return loginData;
});

export type LoginData = Awaited<ReturnType<typeof getLoginData>>;
