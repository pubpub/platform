export type ClientException = {
	isClientException: true;
	message?: string;
	title?: string;
	id?: string;
};

type ClientExceptionOptions = Omit<ClientException, "isClientException">;

export function makeClientException(options: ClientExceptionOptions): ClientException;
export function makeClientException(message: string, id?: string): ClientException;
export function makeClientException(
	message: string | ClientExceptionOptions,
	id?: string
): ClientException {
	if (typeof message === "object") {
		return { ...message, isClientException: true };
	}
	return { isClientException: true, message, id };
}

export const isClientException = (error: unknown): error is ClientException =>
	typeof error === "object" && error !== null && "isClientException" in error;
