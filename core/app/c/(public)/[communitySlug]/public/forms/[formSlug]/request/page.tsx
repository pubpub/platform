import { notFound } from "next/navigation";

import { getLoginData } from "~/lib/auth/loginData";
import { isCommunityAdmin } from "~/lib/auth/roles";
import { getForm } from "~/lib/server/form";
import { RequestForm } from "./RequestForm";

export default async function RequestPage({
	params,
}: {
	params: { formSlug: string; communitySlug: string };
}) {
	const loginData = await getLoginData();

	const isAdmin = isCommunityAdmin(loginData, { slug: params.communitySlug });

	if (!isAdmin) {
		return notFound();
	}

	const form = await getForm({ slug: params.formSlug }).executeTakeFirst();

	if (!form) {
		return notFound();
	}

	return (
		<div className="container mx-auto flex w-full flex-col items-center">
			<RequestForm />
		</div>
	);
}
