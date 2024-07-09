import { headers } from "next/headers";
import { withServerActionInstrumentation } from "@sentry/nextjs";

import { logger } from "logger";

import type { ClientExceptionOptions } from "../serverActions";
import { ClientException, isClientExceptionOptions, makeClientException } from "../serverActions";

/**
 * Wraps a Next.js server action function with Sentry instrumentation. Additionally
 * handles client exceptions and unexpected errors.
 *
 * @param serverActionFn
 * @returns
 */
export const defineServerAction = <
	T extends (...args: unknown[]) => Promise<unknown | ClientExceptionOptions>,
	A extends Parameters<T> = Parameters<T>,
	R extends Awaited<ReturnType<T>> = Awaited<ReturnType<T>>,
>(
	serverActionFn: T
) => {
	return async function runServerAction(...args: A) {
		return withServerActionInstrumentation(
			serverActionFn.name,
			{
				headers: headers(),
				recordResponse: true,
			},
			async () => {
				try {
					const serverActionResult = (await serverActionFn(...args)) as R;
					// The server action result might be client exception options, in which case
					// we should return it as a client exception. Otherwise, we should return the
					// server action result as-is.
					return isClientExceptionOptions(serverActionResult)
						? // Create a client exception and send its cause (if any) to Sentry.
							makeClientException(serverActionResult)
						: serverActionResult;
				} catch (error) {
					logger.debug(error);
					// https://github.com/vercel/next.js/discussions/49426#discussioncomment-8176059
					// Because you can't simply wrap a server action call on the client in try/catch
					// we should provide some sort of error response to the client in the case of an
					// unexpected error. But because we catch uncaught errors ourselves here, Sentry's
					// `withServerActionInstrumentation` is not really providing much use at this point.
					return makeClientException({
						error: "An unexpected error occurred",
						cause: error,
					});
				}
			}
		);
	};
};
