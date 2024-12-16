import { useCallback } from "react";
import { captureException } from "@sentry/nextjs";

import { logger } from "logger";
import { toast } from "ui/use-toast";

export type ClientException = {
	isClientException: true;
	error: string;
	title?: string;
	id?: string;
};

export type ClientExceptionOptions = Omit<ClientException, "isClientException"> & {
	cause?: unknown;
};

export function makeClientException(options: ClientExceptionOptions): ClientException;
export function makeClientException(message: string, id?: string): ClientException;
export function makeClientException(
	message: string | ClientExceptionOptions,
	id?: string
): ClientException {
	if (typeof message === "object") {
		if ("cause" in message) {
			const { cause, ...messageWithoutCause } = message;
			logger.debug(cause);
			const id = captureException(cause);
			return { ...messageWithoutCause, isClientException: true, id };
		}
		return { ...message, isClientException: true };
	}
	return { isClientException: true, error: message, id };
}

export const isClientException = (error: unknown): error is ClientException =>
	typeof error === "object" && error !== null && "isClientException" in error;

export const isClientExceptionOptions = (error: unknown): error is ClientExceptionOptions =>
	typeof error === "object" && error !== null && "error" in error;

export function useServerAction<T extends unknown[], U>(action: (...args: T) => Promise<U>) {
	const runServerAction = useCallback(
		async function runServerAction(...args: T) {
			const result = await action(...args);
			if (isClientException(result)) {
				toast({
					title: result.title ?? "Error",
					variant: "destructive",
					description: `${result.error}${result.id ? ` (Error ID: ${result.id})` : ""}`,
				});
			}
			return result;
		},
		[action, toast]
	);
	return runServerAction;
}

export const didSucceed = <T extends object>(result: T): result is Exclude<T, ClientException> =>
	Reflect.get(result, "error") === undefined;
