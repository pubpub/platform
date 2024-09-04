import React from "react";

import type { PubsId } from "db/public";

import type { FormFillPageParams, FormFillPageSearchParams } from "../fill/page";
import { getForm } from "~/lib/server/form";
import { handleFormToken } from "../fill/utils";
import { RequestLink } from "./RequestLink";

export default async function Page({
	params,
	searchParams,
}: {
	params: FormFillPageParams;
	searchParams: FormFillPageSearchParams;
}) {
	const form = await getForm({ slug: params.formSlug }).executeTakeFirst();

	if (!form) {
		return <div>No form found</div>;
	}

	if (!searchParams.pubId) {
		return <div>No pubId provided</div>;
	}

	if (!searchParams.token) {
		return <div>No token provided</div>;
	}

	const hasAccess = await handleFormToken({
		params,
		searchParams,
		onValidToken: ({ params, searchParams, result }) => {
			throw new Error("User somehow redirected to page with valid token");
		},
		onExpired: ({ params, searchParams, result }) => {
			// good, do nothing
			return;
		},
	});

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
				token={searchParams.token}
				pubId={searchParams.pubId as PubsId}
			/>
		</div>
	);
}
