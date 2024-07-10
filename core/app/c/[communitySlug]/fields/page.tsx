import { notFound } from "next/navigation";
import { sql } from "kysely";
import { jsonBuildObject } from "kysely/helpers/postgres";

import { FormInput } from "ui/icon";

import type { PubFieldsId } from "~/kysely/types/public/PubFields";
import type { PubField } from "~/lib/types";
import { FieldsProvider } from "~/app/c/[communitySlug]/types/FieldsProvider";
import { db } from "~/kysely/database";
import { getLoginData } from "~/lib/auth/loginData";
import { autoCache } from "~/lib/server/cache/autoCache";
import ContentLayout from "../ContentLayout";

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

	const { fields } = await getFields();

	if (!fields) {
		return null;
	}
	return (
		<FieldsProvider fields={fields}>
			<ContentLayout
				heading={
					<>
						<FormInput size={24} strokeWidth={1} className="mr-2 text-slate-500" />{" "}
						Forms
					</>
				}
			>
				<div className="m-4">TODO: table</div>
			</ContentLayout>
		</FieldsProvider>
	);
}
