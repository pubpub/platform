import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "kysely";
import { jsonBuildObject } from "kysely/helpers/postgres";

import type { PubFieldsId } from "~/kysely/types/public/PubFields";
import type { PubField } from "~/lib/types";
import { db } from "~/kysely/database";
import { getLoginData } from "~/lib/auth/loginData";
import { autoCache } from "~/lib/server/cache/autoCache";
import { getTypes } from "~/lib/server/pubtype";
import { CreatePubType } from "./CreatePubType";
import { FieldsProvider } from "./FieldsProvider";
import TypeList from "./TypeList";

// TODO: this should probably filter by the community, but fields aren't actually scoped to a community yet!
const getFields = async () =>
	await autoCache(
		db
			.with("f", (eb) =>
				eb
					.selectFrom("pub_fields")
					.select("id")
					.select((eb) => [
						jsonBuildObject({
							id: eb.ref("id"),
							name: eb.ref("name"),
							slug: eb.ref("slug"),
						}).as("json"),
					])
			)
			.selectFrom("f")
			.select((eb) => [
				eb.fn
					.coalesce(
						sql<Record<PubFieldsId, PubField>>`json_object_agg(f.id, f.json)`,
						sql`'{}'`
					)
					.as("fields"),
			])
	).executeTakeFirstOrThrow();

type Props = { params: { communitySlug: string } };

export default async function Page({ params }: Props) {
	const loginData = await getLoginData();
	if (!loginData) {
		return notFound();
	}

	const types = await getTypes(params.communitySlug).execute();
	const { fields } = await getFields();

	if (!types || !fields) {
		return null;
	}
	return (
		<FieldsProvider fields={fields}>
			<div className="mb-16 flex items-center justify-between">
				<h1 className="flex-grow text-xl font-bold">Pub Types</h1>
				<div className="flex items-center gap-x-2">
					<CreatePubType />
				</div>
			</div>
			<TypeList types={types} superadmin={loginData.isSuperAdmin} />
		</FieldsProvider>
	);
}
