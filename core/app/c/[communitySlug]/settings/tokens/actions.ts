"use server";

import type { CreateTokenFormSchema } from "./CreateTokenForm";
import type { NewApiAccessPermissions } from "~/kysely/types/public/ApiAccessPermissions";
import type ApiAccessScope from "~/kysely/types/public/ApiAccessScope";
import type { ApiAccessTokensId } from "~/kysely/types/public/ApiAccessTokens";
import type ApiAccessType from "~/kysely/types/public/ApiAccessType";
import type { UsersId } from "~/kysely/types/public/Users";
import { getLoginData } from "~/lib/auth/loginData";
import { createApiAccessToken, deleteApiAccessToken } from "~/lib/server/apiAccessTokens";
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug";
import { findCommunityBySlug } from "~/lib/server/community";
import { defineServerAction } from "~/lib/server/defineServerAction";

export const createToken = defineServerAction(async function createToken(
	data: CreateTokenFormSchema
) {
	const loginData = await getLoginData();

	if (!loginData?.isSuperAdmin) {
		throw new Error("You must be a super admin to create tokens");
	}

	const communitySlug = getCommunitySlug();
	const community = await findCommunityBySlug(communitySlug);

	if (!community) {
		throw new Error("Community not found");
	}

	const permissions = Object.entries(data.permissions).flatMap(([scope, value]) =>
		!value
			? []
			: Object.entries(value).flatMap(([type, value]) =>
					!value
						? []
						: ({
								scope: scope as ApiAccessScope,
								accessType: type as ApiAccessType,
								constraints: value === true ? undefined : value,
							} satisfies Omit<NewApiAccessPermissions, "apiAccessTokenId">)
				)
	);

	const newToken = await createApiAccessToken({
		token: {
			communityId: community.id,
			name: data.name,
			description: data.description,
			expiration: data.expiration,
			issuedById: loginData.id as UsersId,
		},
		permissions,
	}).executeTakeFirstOrThrow();

	return { success: true, data: { token: newToken.token } };
});

export const deleteToken = defineServerAction(async function deleteToken({
	id,
}: {
	id: ApiAccessTokensId;
}) {
	const loginData = await getLoginData();

	if (!loginData?.isSuperAdmin) {
		throw new Error("You must be a super admin to delete tokens");
	}

	const communitySlug = getCommunitySlug();
	const community = await findCommunityBySlug(communitySlug);

	if (!community) {
		throw new Error("Community not found");
	}

	await deleteApiAccessToken({ id }).execute();
});
