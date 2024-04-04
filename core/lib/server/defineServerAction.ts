import { withServerActionInstrumentation } from "@sentry/nextjs";
import { headers } from "next/headers";
import { isClientExceptionOptions, makeClientException } from "../serverActions";

export const defineServerAction = <T extends (...args: unknown[]) => unknown>(fn: T) => {
	return async function runServerAction(...args: Parameters<T>) {
		return withServerActionInstrumentation(fn.name, { headers: headers() }, async () => {
			const result = await fn(...args);
			return isClientExceptionOptions(result) ? makeClientException(result) : result;
		});
	};
};
