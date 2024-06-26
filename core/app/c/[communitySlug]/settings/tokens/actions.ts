"use server";

import { randomUUID } from "crypto";

import { revalidatePath, revalidateTag } from "next/cache";

import type { CreateTokenFormSchema } from "./CreateTokenForm";
import type { NewApiAccessPermissions } from "~/kysely/types/public/ApiAccessPermissions";
import type ApiAccessScope from "~/kysely/types/public/ApiAccessScope";
import type ApiAccessType from "~/kysely/types/public/ApiAccessType";
import type { UsersId } from "~/kysely/types/public/Users";
import { db } from "~/kysely/database";
import { getLoginData } from "~/lib/auth/loginData";
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug";
import { findCommunityBySlug } from "~/lib/server/community";
import { defineServerAction } from "~/lib/server/defineServerAction";

export const createToken = defineServerAction(async function createToken(
	data: CreateTokenFormSchema
) {
	// validate
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

	const token = randomUUID();

	const newToken = await db
		.with("new_token", (db) =>
			db
				.insertInto("api_access_tokens")
				.values({
					token,
					communityId: community.id,
					name: data.name,
					description: data.description,
					expiration: data.expiration,
					issuedById: loginData.id as UsersId,
				})
				.returning(["id", "token"])
		)
		.with("permissions", (db) =>
			db.insertInto("api_access_permissions").values((eb) =>
				permissions.map((permission) => ({
					...permission,
					apiAccessTokenId: eb.selectFrom("new_token").select("new_token.id"),
				}))
			)
		)
		.selectFrom("new_token")
		.select("new_token.token")
		.executeTakeFirstOrThrow();

	revalidatePath(`/c/${communitySlug}/settings/tokens`);

	return { success: true, data: { token: newToken.token } };
});
