import "server-only";

import { cache } from "react";

import type { ExtraSessionValidationOptions } from "./lucia";
import { validateRequest } from "./lucia";

export const getLoginData = cache(async (opts?: ExtraSessionValidationOptions) => {
	return validateRequest(opts);
});

export type LoginData = Awaited<ReturnType<typeof getLoginData>>;
