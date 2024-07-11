import { notFound } from "next/navigation";
import { sql } from "kysely";

import type { PubFieldsId } from "db/public/PubFields";
import { PubFieldProvider } from "ui/pubFields";

import { db } from "~/kysely/database";
import { getLoginData } from "~/lib/auth/loginData";
import { autoCache } from "~/lib/server/cache/autoCache";
import { getPubFields } from "~/lib/server/pubFields";
import { CreatePubType } from "./CreatePubType";
import TypeList from "./TypeList";

const getTypes = async (communitySlug: string) =>
	await autoCache(
		db
			.selectFrom("pub_types")
			.innerJoin("communities", "communities.id", "pub_types.communityId")
			.where("communities.slug", "=", communitySlug)
			.select([
				"pub_types.id",
				"pub_types.name",
				"pub_types.description",
				(eb) =>
					eb
						.selectFrom("_PubFieldToPubType")
						.whereRef("B", "=", "pub_types.id")
						.select((eb) =>
							eb.fn.coalesce(eb.fn.agg("array_agg", ["A"]), sql`'{}'`).as("fields")
						)
						.as("fields"),
			])
			// This type param could be passed to eb.fn.agg above, but $narrowType would still be required to assert that fields is not null
			.$narrowType<{ fields: PubFieldsId[] }>()
	).execute();

type Props = { params: { communitySlug: string } };

export default async function Page({ params }: Props) {
	const loginData = await getLoginData();
	if (!loginData) {
		return notFound();
	}

	const [types, { fields }] = await Promise.all([
		getTypes(params.communitySlug),
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
			<TypeList types={types} superadmin={loginData.isSuperAdmin} />
		</PubFieldProvider>
	);
}
