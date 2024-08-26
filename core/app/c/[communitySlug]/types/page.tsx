import { notFound } from "next/navigation";

import type { PubFieldsId } from "db/public";
import { PubFieldProvider } from "ui/pubFields";

import { getLoginData } from "~/lib/auth/loginData";
import { isCommunityAdmin } from "~/lib/auth/roles";
import { getPubFields } from "~/lib/server/pubFields";
import { getAllPubTypesForCommunity } from "~/lib/server/pubtype";
import { CreatePubType } from "./CreatePubType";
import TypeList from "./TypeList";

export default async function Page({ params: { communitySlug } }) {
	const loginData = await getLoginData();
	if (!loginData) {
		return notFound();
	}
	const allowEditing = isCommunityAdmin(loginData, { slug: communitySlug });

	const [types, { fields }] = await Promise.all([
		getAllPubTypesForCommunity().execute(),
		getPubFields().executeTakeFirstOrThrow(),
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
