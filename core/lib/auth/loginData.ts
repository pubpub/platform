import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import prisma from "~/prisma/db";
import { REFRESH_NAME, TOKEN_NAME } from "~/lib/auth/cookies";
import { getUserInfoFromJWT } from "~/lib/auth/loginId";
import { generateHash, slugifyString } from "../string";

/* This is only called from Server Component functions */
/* When in the API, use getLoginId from loginId.ts */
export const getLoginData = cache(async () => {
	const nextCookies = cookies();
	const sessionJWTCookie = nextCookies.get(TOKEN_NAME) || { value: "" };
	const sessionRefreshCookie = nextCookies.get(REFRESH_NAME) || { value: "" };
	const supabaseUser = await getUserInfoFromJWT(
		sessionJWTCookie.value,
		sessionRefreshCookie.value
	);
	if (!supabaseUser?.id) {
		return undefined;
	}
	let user = await prisma.user.findUnique({
		where: { supabaseId: supabaseUser.id },
	});

	if (!user) {
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
		const communityId = supabaseUser.user_metadata.communityId;
		const canAdmin = supabaseUser.user_metadata.canAdmin ?? false;

		user = await prisma.user.create({
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
						canAdmin,
					},
				},
			},
		});
	}
	return user;
});

export const handleRedirect = async () => {
	const loginData = await getLoginData();

	if (loginData) {
		/* If we have a logged in user navigating to `/`, check */
		/* if they are a member of any community, and if so,    */
		/* redirect them to that community by default. We could */
		/* eventually have a query param override, but this     */
		/* assumes that logged in users landing on pubpub.org   */
		/* want to go to their dashboard a la github or twitter */
		/* TODO: Does not select for member-group access yet */
		const community = await prisma.community.findFirst({
			where: { members: { some: { userId: loginData.id } } },
			select: { slug: true },
		});
		// console.log("community", community);
		// if (community) {
		// 	redirect(`/c/${community.slug}`);
		// }
	}
};
