import type { Metadata } from "next";

import { notFound } from "next/navigation";

import { PubFieldProvider } from "ui/pubFields";

import { getPageLoginData } from "~/lib/auth/loginData";
import { isCommunityAdmin } from "~/lib/auth/roles";
import { findCommunityBySlug } from "~/lib/server/community";
import { getPubFields } from "~/lib/server/pubFields";
import { getAllPubTypesForCommunity } from "~/lib/server/pubtype";
import { CreatePubType } from "./CreatePubType";
import TypeList from "./TypeList";

export const metadata: Metadata = {
	title: "Pub Types",
};

export default async function Page({
	params: { communitySlug },
}: {
	params: {
		communitySlug: string;
	};
}) {
	const { user } = await getPageLoginData();

	const community = await findCommunityBySlug();

	if (!user || !community) {
		return notFound();
	}

	const allowEditing = isCommunityAdmin(user, { slug: communitySlug });

	const [types, { fields }] = await Promise.all([
		getAllPubTypesForCommunity(communitySlug).execute(),
		getPubFields({ communityId: community.id }).executeTakeFirstOrThrow(),
	]);

	if (!types || !fields) {
		return null;
	}
	return (
		<PubFieldProvider pubFields={fields}>
			<div className="mb-16 flex items-center justify-between">
				<h1 className="flex-grow text-xl font-bold">Pub Types</h1>
				<div className="flex items-center gap-x-2">
					<CreatePubType />
				</div>
			</div>
			<TypeList types={types} allowEditing={allowEditing} />
		</PubFieldProvider>
	);
}
