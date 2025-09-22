import crypto from "node:crypto";

import type { TsRestRequest } from "@ts-rest/serverless";
import type { NextRequest } from "next/server";

import { headers } from "next/headers";
import { jsonObjectFrom } from "kysely/helpers/postgres";
import qs from "qs";
import { z } from "zod";

import type { User } from "contracts";
import type { Communities, UsersId } from "db/public";
import type {
	ApiAccessPermission,
	ApiAccessPermissionConstraintsInput,
	LastModifiedBy,
} from "db/types";
import { ApiAccessScope, ApiAccessType } from "db/public";

import type { CapabilityTarget } from "../authorization/capabilities";
import { db } from "~/kysely/database";
import { userCan } from "../authorization/capabilities";
import { createLastModifiedBy } from "../lastModifiedBy";
import { validateApiAccessToken } from "../server/apiAccessTokens";
import { findCommunityBySlug } from "../server/community";
import {
	BadRequestError,
	ForbiddenError,
	NotFoundError,
	UnauthorizedError,
} from "../server/errors";
import { SAFE_USER_SELECT } from "../server/user";
import { getLoginData } from "./loginData";

export const getBearerToken = (authHeader: string) => {
	const parts = authHeader.split("Bearer ");
	if (parts.length !== 2) {
		throw new BadRequestError("Unable to parse authorization header");
	}
	return parts[1];
};

export const compareAPIKeys = (key1: string, key2: string) => {
	if (
		key1.length === key2.length &&
		crypto.timingSafeEqual(new Uint8Array(Buffer.from(key1)), new Uint8Array(Buffer.from(key2)))
	) {
		return;
	}

	throw new UnauthorizedError("Invalid API key");
};

export const baseAuthorizationObject = Object.fromEntries(
	Object.keys(ApiAccessScope).map(
		(scope) =>
			[
				scope,
				Object.fromEntries(
					Object.keys(ApiAccessType).map((type) => [type, false] as const)
				),
			] as const
	)
) as ApiAccessPermissionConstraintsInput;

const bearerRegex = /Bearer ([^\s+])/;
const bearerSchema = z
	.string()
	.regex(bearerRegex)
	.transform((string) => string.replace(bearerRegex, "$1"));

export const getAuthorization = async () => {
	const authorizationTokenWithBearer = (await headers()).get("Authorization");

	const apiKeyParse = bearerSchema.safeParse(authorizationTokenWithBearer);
	if (!apiKeyParse.success) {
		throw new ForbiddenError("Invalid token");
	}
	const apiKey = apiKeyParse.data;

	const community = await findCommunityBySlug();

	if (!community) {
		throw new NotFoundError(`No community found`);
	}

	// this throws, and we should let it
	const validatedAccessToken = await validateApiAccessToken(apiKey, community.id);

	const rules = await db
		.selectFrom("api_access_permissions")
		.selectAll("api_access_permissions")
		.innerJoin(
			"api_access_tokens",
			"api_access_tokens.id",
			"api_access_permissions.apiAccessTokenId"
		)
		.select((eb) =>
			jsonObjectFrom(
				eb
					.selectFrom("users")
					.select(SAFE_USER_SELECT)
					.whereRef("users.id", "=", eb.ref("api_access_tokens.issuedById"))
			).as("user")
		)
		.where("api_access_permissions.apiAccessTokenId", "=", validatedAccessToken.id)
		.$castTo<ApiAccessPermission & { user: User }>()
		.execute();

	const user = rules[0].user;
	if (!rules[0].user && !validatedAccessToken.isSiteBuilderToken) {
		throw new NotFoundError(`Unable to locate user associated with api token`);
	}

	return {
		user,
		authorization: rules.reduce((acc, curr) => {
			if (!curr.constraints) {
				acc[curr.scope][curr.accessType] = true;
				return acc;
			}

			acc[curr.scope][curr.accessType] = curr.constraints ?? true;
			return acc;
		}, baseAuthorizationObject),
		apiAccessTokenId: validatedAccessToken.id,
		isSiteBuilderToken: validatedAccessToken.isSiteBuilderToken,
		community,
	};
};

export type AuthorizationOutput<S extends ApiAccessScope, AT extends ApiAccessType> = {
	authorization: true | Exclude<(typeof baseAuthorizationObject)[S][AT], false>;
	community: Communities;
	lastModifiedBy: LastModifiedBy;
	// is empty for site builder tokens
	// should be empty for other tokens, but isn't.
	// we are incorrectly passing the user who minted the token to eg getPubs and getStages
	user?: User;
	isSiteBuilderToken?: boolean;
};

export const checkAuthorization = async <
	S extends ApiAccessScope,
	AT extends ApiAccessType,
	T extends CapabilityTarget,
>({
	token,
	cookies,
}: {
	token: {
		scope: S;
		type: AT;
	};
	cookies:
		| {
				capability: Parameters<typeof userCan<T>>[0];
				target: T;
		  }
		| "community-member"
		| boolean;
}): Promise<AuthorizationOutput<S, AT>> => {
	const authorizationTokenWithBearer = (await headers()).get("Authorization");

	if (authorizationTokenWithBearer) {
		const { user, authorization, community, apiAccessTokenId, isSiteBuilderToken } =
			await getAuthorization();

		const constraints = authorization[token.scope][token.type];
		if (!constraints) {
			throw new ForbiddenError(`You are not authorized to ${token.type} ${token.scope}`);
		}

		const lastModifiedBy = createLastModifiedBy({
			apiAccessTokenId: apiAccessTokenId,
		});

		return {
			authorization: constraints as Exclude<typeof constraints, false>,
			community,
			lastModifiedBy,
			user,
			isSiteBuilderToken,
		};
	}

	if (!cookies) {
		throw new UnauthorizedError("This resource is only accessible using an API key");
	}

	const [{ user }, community] = await Promise.all([getLoginData(), findCommunityBySlug()]);

	if (!user) {
		throw new UnauthorizedError(
			"You must either provide an `Authorization: Bearer ` header or be logged in to access this resource"
		);
	}

	if (!community) {
		throw new NotFoundError(`No community found`);
	}

	const lastModifiedBy = createLastModifiedBy({
		userId: user.id as UsersId,
	});

	// Handle cases where we only want to check for login but have no specific capability yet
	if (typeof cookies === "boolean") {
		return { user, authorization: true as const, community, lastModifiedBy };
	}

	// Handle when we just want to check the user is part of the community
	if (cookies === "community-member") {
		const userCommunityIds = user.memberships.map((m) => m.communityId);
		if (!userCommunityIds.includes(community.id)) {
			throw new ForbiddenError(`You are not authorized to perform actions in this community`);
		}
		return { user, authorization: true as const, community, lastModifiedBy };
	}

	const can = await userCan(cookies.capability, cookies.target, user.id);

	if (!can) {
		throw new ForbiddenError(
			`You are not authorized to ${cookies.capability} ${cookies.target.type}`
		);
	}

	return { user, authorization: true as const, community, lastModifiedBy };
};

export const shouldReturnRepresentation = async () => {
	const prefer = (await headers()).get("Prefer");

	if (prefer === "return=representation") {
		return true;
	}
	return false;
};

export type RequestMiddleware = (
	req: TsRestRequest,
	platformArgs: {
		nextRequest: NextRequest;
	}
) => void;

// ================
// Middleware
// Note: Middleware runs before zod validation
// ================

/**
 * Parse the query string with `qs` instead of itty routers built in parser
 * This handles objects and arrays better,
 * eg `?foo[0]=2&bar[foo]=3` -> `{ foo: ["2"], bar: { foo: "3" } }`
 * instead of
 * `{ foo[0]: "2", bar[foo]: "3"}`
 */
export const parseQueryWithQsMiddleware: RequestMiddleware = (req) => {
	// parse the queries with `qs`
	const query = req.url.split("?")[1];
	// @ts-expect-error - this obviously errors, but it's fine
	req.query = query
		? qs.parse(query, { depth: 10, arrayLimit: 1000, allowDots: false })
		: req.query;
};
