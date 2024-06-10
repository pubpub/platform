import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import { jsonArrayFrom } from "kysely/helpers/postgres";

import { db } from "~/kysely/database";
import { getLoginData } from "~/lib/auth/loginData";
import { FieldsProvider } from "./FieldsProvider";
import TypeList from "./TypeList";

// TODO: this should probably filter and cache by the community, but fields aren't actually scoped to a community yet!
const getFields = unstable_cache(
	async () => {
		return await db.selectFrom("pub_fields").select(["id", "name", "slug"]).execute();
	},
	undefined,
	{ tags: ["fields"] }
);

const getTypes = async (communitySlug: string) => {
	return await db
		.selectFrom("pub_types")
		.innerJoin("communities", "communities.id", "pub_types.communityId")
		.innerJoin("_PubFieldToPubType", "_PubFieldToPubType.B", "pub_types.id")
		.where("communities.slug", "=", communitySlug)
		.selectAll("pub_types")
		.select((eb) =>
			jsonArrayFrom(
				eb
					.selectFrom("_PubFieldToPubType")
					.whereRef("B", "=", "pub_types.id")
					.innerJoin("pub_fields", "pub_fields.id", "A")
					.selectAll("pub_fields")
			).as("fields")
		)
		.groupBy("pub_types.id")
		.execute();
};

type Props = { params: { communitySlug: string } };

export default async function Page({ params }: Props) {
	const loginData = await getLoginData();
	if (!loginData) {
		return notFound();
	}

	const types = await getTypes(params.communitySlug);
	const fields = await getFields();

	if (!types || !fields) {
		return null;
	}
	return (
		<>
			<h1 style={{ marginBottom: "2em" }}>Types</h1>
			<FieldsProvider fields={fields}>
				<TypeList types={types} superadmin={!!loginData?.isSuperAdmin} />
			</FieldsProvider>
		</>
	);
}
