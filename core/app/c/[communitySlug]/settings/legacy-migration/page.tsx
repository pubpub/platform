import { notFound, redirect } from "next/navigation";

import { Button } from "ui/button";

import { getPageLoginData } from "~/lib/authentication/loginData";
import { findCommunityBySlug } from "~/lib/server/community";
import { importFromLegacy } from "~/lib/server/legacy-migration/legacy-migration";
import { MigrationForm } from "./MigrationForm";

export default async function Page() {
	const { user } = await getPageLoginData();
	const community = await findCommunityBySlug();

	if (!community) {
		notFound();
	}

	if (!user.isSuperAdmin) {
		redirect(`/c/${community.slug}/unauthorized`);
	}

	return (
		<div>
			<h1 className="mb-12 text-2xl font-bold">Legacy Migration</h1>

			<MigrationForm community={community} />
		</div>
	);
}
