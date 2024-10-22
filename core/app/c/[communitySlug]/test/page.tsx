import type { Metadata } from "next";

import { notFound } from "next/navigation";

import { ContextEditorClient } from "~/app/components/ContextEditorClient";
import { getPageLoginData } from "~/lib/auth/loginData";
import { getPubs, getPubTypesForCommunity } from "~/lib/server";
import { findCommunityBySlug } from "~/lib/server/community";

export const metadata: Metadata = {
	title: "Test page",
};

export default async function Page({ params }: { params: { communitySlug: string } }) {
	await getPageLoginData();
	const { communitySlug } = params;
	const community = await findCommunityBySlug();

	if (!community) {
		return notFound();
	}

	const [pubs, pubTypes] = await Promise.all([
		getPubs({ communityId: community.id }),
		getPubTypesForCommunity(community.id),
	]);

	return (
		<main className="flex flex-col items-start gap-y-4">
			<h1 className="text-xl font-bold">Test</h1>
			<ContextEditorClient pubs={pubs} pubTypes={pubTypes} />
		</main>
	);
}
