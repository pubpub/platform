import { redirect } from "next/navigation";

import { getLoginData } from "~/lib/auth/loginData";

export default async function Page() {
	const { user } = await getLoginData();

	// if user and no commuhnmitiy, redirect to settings
	if (!user) {
		redirect("/login");
	}

	const memberSlug = user.memberships[0]?.community?.slug;

	if (!memberSlug) {
		redirect("/settings");
	}

	redirect(`/c/${memberSlug}/stages`);
}
