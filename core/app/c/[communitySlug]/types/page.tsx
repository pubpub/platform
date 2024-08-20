import { notFound } from "next/navigation";

import type { PubFieldsId } from "db/public";
import { PubFieldProvider } from "ui/pubFields";

import { getLoginData } from "~/lib/auth/loginData";
import { getPubFields } from "~/lib/server/pubFields";
import { getAllPubTypesForCommunity } from "~/lib/server/pubtype";
import { CreatePubType } from "./CreatePubType";
import TypeList from "./TypeList";

export default async function Page() {
	const { user } = await getLoginData();
	if (!user) {
		return notFound();
	}

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
			<TypeList types={types} superadmin={user.isSuperAdmin} />
		</PubFieldProvider>
	);
}
