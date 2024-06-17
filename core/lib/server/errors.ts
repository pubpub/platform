import type { ErrorHttpStatusCode } from "@ts-rest/core";
import type { TsRestRequest } from "@ts-rest/serverless";

import { NextResponse } from "next/server";
import { TsRestResponse } from "@ts-rest/serverless";

import { logger } from "logger";

export class HTTPStatusError<Status extends ErrorHttpStatusCode> extends Error {
	readonly status: ErrorHttpStatusCode;

	constructor(status: Status, message?: string) {
		super(`HTTP Error ${status}${message ? ": " + message : ""}`);
		this.status = status;
	}
}

export class BadRequestError extends HTTPStatusError<400> {
	constructor(message?: string) {
		super(400, message);
	}
}

export class UnauthorizedError extends HTTPStatusError<401> {
	constructor(message?: string) {
		super(401, message);
	}
}

export class ForbiddenError extends HTTPStatusError<403> {
	constructor(message?: string) {
		super(403, message);
	}
}

export class NotFoundError extends HTTPStatusError<404> {
	constructor(message?: string) {
		super(404, message);
	}
}

// For use in app router API routes
export const handleErrors = async (routeHandler) => {
	try {
		return await routeHandler();
	} catch (error) {
		if (error instanceof HTTPStatusError) {
			return NextResponse.json({ message: error.message }, { status: error.status });
		}
		if (error instanceof Error) {
			logger.error(error.message);
		}
		return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
	}
};

export const tsRestHandleErrors = (error: unknown, req: TsRestRequest): TsRestResponse => {
	if (error instanceof HTTPStatusError) {
		return TsRestResponse.fromJson({
			status: error.status,

			body: { message: error.message },
		});
	}
	if (error instanceof Error) {
		logger.error(error.message);
	}
	return TsRestResponse.fromJson({
		status: 500,
		body: { message: "Internal Server Error" },
	});
};
