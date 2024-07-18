import React from "react";

import { getForm, userHasPermissionToForm } from "~/lib/server/form";
import { RequestLink } from "./RequestLink";

export default async function Page({
	params,
	searchParams,
}: {
	params: { formSlug: string; communitySlug: string };
	searchParams: { email?: string };
}) {
	const form = await getForm({ slug: params.formSlug }).executeTakeFirst();

	if (!form) {
		return <div>No form found</div>;
	}

	if (!searchParams.email) {
		return <div>No email provided</div>;
	}

	const hasAccessToForm = await userHasPermissionToForm({
		formId: form.id,
		email: searchParams.email,
	});

	if (!hasAccessToForm) {
		return <div>You do not have permission to access this form</div>;
	}

	return (
		<div className="mx-auto mt-32 flex max-w-md flex-col items-center justify-center text-center">
			<h2 className="mb-2 text-lg font-semibold">Link Expired</h2>
			<p className="mb-6 text-sm">
				The link for this form has expired. Request a new one via email below to pick up
				right where you left off.
			</p>
			<RequestLink
				formSlug={params.formSlug}
				communitySlug={params.communitySlug}
				email={searchParams.email}
			/>
		</div>
	);
}
