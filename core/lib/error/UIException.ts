export type UIException = {
	isUiException: true;
	message: string;
	title?: string;
	id?: string;
};

export const makeUiException = (message: string, id?: string): UIException => ({
	isUiException: true,
	message,
	id,
});

export const isUiException = (error: unknown): error is UIException =>
	typeof error === "object" && error !== null && "isUiException" in error;
