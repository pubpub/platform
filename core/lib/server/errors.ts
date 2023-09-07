import { ErrorHttpStatusCode } from "@ts-rest/core";

export class HTTPStatusError <Status extends ErrorHttpStatusCode> extends Error {
	readonly status: ErrorHttpStatusCode;

	constructor(status: Status, message: string) {
		super(`HTTP Error ${status}${message ? ': ' + message : ''}`);
		this.status = status;
	}
}

export class BadRequestError extends HTTPStatusError<400> {
	constructor(message: string) {
		super(400, message);
	}
}

export class UnauthorizedError extends HTTPStatusError<401> {
	constructor(message: string) {
		super(401, message);
	}
}

export class ForbiddenError extends HTTPStatusError<403> {
	constructor(message: string) {
		super(403, message);
	}
}

export class NotFoundError extends HTTPStatusError<404> {
	constructor(message: string) {
		super(404, message);
	}
}
