import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { LAST_VISITED_COOKIE } from "~/app/components/LastVisitedCommunity/constants";
import { getPageLoginData } from "~/lib/authentication/loginData";

export default async function Page() {
	const { user } = await getPageLoginData();

	if (!user) {
		redirect("/login");
	}

	const cookieStore = await cookies();
	const lastVisited = cookieStore.get(LAST_VISITED_COOKIE);
	const communitySlug = lastVisited?.value ?? user.memberships[0]?.community?.slug;

	if (!communitySlug) {
		redirect("/settings");
	}

	redirect(`/c/${communitySlug}/stages`);
}
