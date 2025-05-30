import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AuthTokenType } from "db/public";

import { LAST_VISITED_COOKIE } from "~/app/components/LastVisitedCommunity/constants";
import { getPageLoginData } from "~/lib/authentication/loginData";
import { createRedirectUrl } from "~/lib/redirect";

export default async function Page({
	searchParams,
}: {
	searchParams: Promise<Record<string, string>>;
}) {
	const { user, session } = await getPageLoginData();

	const params = await searchParams;

	if (!user) {
		redirect(createRedirectUrl("/login", params).toString());
	}

	if (session.type === AuthTokenType.verifyEmail) {
		redirect(createRedirectUrl("/verify", params).toString());
	}

	const cookieStore = await cookies();
	const lastVisited = cookieStore.get(LAST_VISITED_COOKIE);
	const communitySlug = lastVisited?.value ?? user.memberships[0]?.community?.slug;

	if (!communitySlug) {
		redirect(createRedirectUrl("/settings", params).toString());
	}

	redirect(createRedirectUrl(`/c/${communitySlug}/stages`, params).toString());
}
