import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AuthTokenType } from "db/public";

import { LAST_VISITED_COOKIE } from "~/app/components/LastVisitedCommunity/constants";
import { getPageLoginData } from "~/lib/authentication/loginData";

export default async function Page() {
	const { user, session } = await getPageLoginData({
		allowedSessions: [AuthTokenType.generic, AuthTokenType.verifyEmail],
	});

	if (!user) {
		redirect("/login");
	}

	if (session.type === AuthTokenType.verifyEmail) {
		redirect("/verify");
	}

	const cookieStore = await cookies();
	const lastVisited = cookieStore.get(LAST_VISITED_COOKIE);
	const communitySlug = lastVisited?.value ?? user.memberships[0]?.community?.slug;

	if (!communitySlug) {
		redirect("/settings");
	}

	redirect(`/c/${communitySlug}/stages`);
}
