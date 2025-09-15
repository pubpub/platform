import type { ErrorHttpStatusCode } from "@ts-rest/core";
import type { TsRestRequest } from "@ts-rest/serverless";

import { NextResponse } from "next/server";
import { RequestValidationError, TsRestHttpError, TsRestResponse } from "@ts-rest/serverless";
import pg from "pg";

import { logger } from "logger";
import { tryCatch } from "utils/try-catch";

import type { ClientExceptionOptions } from "../serverActions";
import { env } from "../env/env";

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
export const handleErrors = async (routeHandler: () => Promise<NextResponse>) => {
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

export const handleDatabaseErrors = (error: pg.DatabaseError, req: TsRestRequest) => {
	// foreign key violation
	if (error.code === "23503") {
		return TsRestResponse.fromJson(
			{
				status: 400,
				body: { message: error.detail },
			},
			{
				status: 404,
			}
		);
	}

	logger.error(error);
	return TsRestResponse.fromJson(
		{
			status: 500,
			body: { message: "Internal Server Error" },
		},
		{
			status: 500,
		}
	);
	// panic
};

export const tsRestHandleErrors = async (
	error: unknown,
	req: TsRestRequest
): Promise<TsRestResponse> => {
	const [err, body] = req.bodyUsed ? [null, undefined] : await tryCatch(await req.json());
	if (error instanceof RequestValidationError) {
		console.log("INPUT", body);
		logger.error({ err: error.body, input: body });
		return TsRestResponse.fromJson(
			{
				body: error.body,
				input: body,
			},
			{
				status: 400,
			}
		);
	}
	logger.error({ err: error, input: body });
	if (error instanceof HTTPStatusError) {
		return TsRestResponse.fromJson(
			{
				status: error.status,
				body: { message: error.message },
				input: body,
			},
			{
				status: error.status,
			}
		);
	}

	if (error instanceof pg.DatabaseError) {
		return handleDatabaseErrors(error, req);
	}

	if (error instanceof NotFoundError) {
		return TsRestResponse.fromJson(
			{
				status: 404,
				body: { message: error.message },
			},
			{
				status: 404,
			}
		);
	}

	if (error instanceof TsRestHttpError) {
		return TsRestResponse.fromJson(
			{
				status: error.statusCode,
				body: error.body,
				input: body,
			},

			{
				status: error.statusCode,
			}
		);
	}

	if (error instanceof Error) {
		logger.error(error.message);
	}

	logger.error(error);
	return TsRestResponse.fromJson(
		{
			body: { message: "Internal Server Error" },
			input: body,
		},
		{
			status: 500,
			statusText: "Internal Server Error",
		}
	);
};

export const ApiError: Record<string, ClientExceptionOptions> = {
	UNAUTHORIZED: { title: "Unauthorized", error: "You are not authorized to perform this action" },
	NOT_LOGGED_IN: { error: "Not logged in" },
	COMMUNITY_NOT_FOUND: { error: "Community not found" },
	PUB_NOT_FOUND: { error: "Pub not found" },
	PUB_TYPE_NOT_FOUND: { error: "Pub type not found" },
	FEATURE_DISABLED: {
		title: "Feature unavailable",
		error: `The requested feature is not available in ${env.ENV_NAME ? `the ${env.ENV_NAME}` : "this"} environment`,
	},
};
