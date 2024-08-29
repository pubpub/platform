import "server-only";

import type { User as LuciaUser } from "lucia";

import { cache } from "react";
import { cookies } from "next/headers";
import { AuthToken, AuthTokenType } from "@prisma/client";

import { MemberRole } from "db/public";

import type { ExtraSessionValidationOptions } from "./lucia";
import { REFRESH_NAME, TOKEN_NAME } from "~/lib/auth/cookies";
import { getUserInfoFromJWT } from "~/lib/auth/loginId";
import prisma from "~/prisma/db";
import { unJournalId } from "~/prisma/exampleCommunitySeeds/unjournal";
import { getUser } from "../server/user";
import { generateHash, slugifyString } from "../string";
import { validateRequest } from "./lucia";

const FAKE_SUPABASE_SESSION = {
	id: "fake-session-id",
} as const;

export const getLoginData = cache(async (opts?: ExtraSessionValidationOptions) => {
	const nextCookies = cookies();

	const { session, user: luciaUser } = await validateRequest(opts);

	if (session && luciaUser) {
		return {
			session,
			user: luciaUser,
		};
	}

	const sessionJWTCookie = nextCookies.get(TOKEN_NAME) || { value: "" };
	const sessionRefreshCookie = nextCookies.get(REFRESH_NAME) || { value: "" };
	const supabaseUser = await getUserInfoFromJWT(
		sessionJWTCookie.value,
		sessionRefreshCookie.value
	);

	if (!supabaseUser?.id || !supabaseUser.email) {
		return { session: null, user: null };
	}

	const user = await getUser({ email: supabaseUser.email }).executeTakeFirst();

	if (user && !user.supabaseId) {
		// They logged in via supabase, but the app db record doesn't have a supabaseId yet
		await prisma.user.update({
			where: {
				email: supabaseUser.email,
			},
			data: {
				supabaseId: supabaseUser.id,
			},
		});
	}

	if (user) {
		return { session: FAKE_SUPABASE_SESSION, user: user as LuciaUser };
	}

	// They successfully logged in via supabase, but no corresponding record was found in the
	// app database

	if (!supabaseUser.email) {
		throw new Error(
			`Unable to create corresponding local record for supabase user ${supabaseUser.id}`
		);
	}

	// TODO: Instead of this, we should force invited users to visit the settings screen and set
	// a name before progressing
	const firstName = supabaseUser.user_metadata.firstName ?? "";
	const lastName = supabaseUser.user_metadata.lastName ?? null;
	const communityId = supabaseUser.user_metadata.communityId ?? unJournalId;
	const role = supabaseUser.user_metadata.role ?? MemberRole.editor;

	const { passwordHash, ...newUser } = await prisma.user.create({
		data: {
			email: supabaseUser.email,
			supabaseId: supabaseUser.id,
			firstName,
			lastName,
			slug: `${slugifyString(firstName)}${
				lastName ? `-${slugifyString(lastName)}` : ""
			}-${generateHash(4, "0123456789")}`,
			memberships: {
				create: {
					communityId,
					role,
				},
			},
		},
		include: {
			memberships: {
				include: {
					community: true,
				},
			},
		},
	});

	// for type consistency sake
	// this is innefficient, but it's fine for now
	const newlyCreatedUser = await getUser({ email: newUser.email }).executeTakeFirst();

	return { session: FAKE_SUPABASE_SESSION, user: newlyCreatedUser as LuciaUser };
});

export type LoginData = Awaited<ReturnType<typeof getLoginData>>;
