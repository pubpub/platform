import type { CommunitiesId, CoreSchemaType } from "db/public";

import { db } from "~/kysely/database";
import { slugifyString } from "~/lib/string";

export type PubFieldsInitializer = Record<
	string,
	CoreSchemaType
	// | {
	// 		relation: true;
	// 		schemaName?: CoreSchemaType;
	//   }
>;

export const createPubFields = ({
	pubFields,
	communitySlug,
	communityId,
}: {
	pubFields: PubFieldsInitializer;
	communitySlug: string;
	communityId: CommunitiesId;
}) => {
	return db
		.insertInto("pub_fields")
		.values(
			Object.entries(pubFields).map(([name, schemaName]) => {
				const slug = slugifyString(name);
				return {
					name: name,
					slug: `${communitySlug}:${slug}`,
					communityId: communityId,
					...(typeof schemaName === "object"
						? {
								schemaName: schemaName.schemaName,
								relation: schemaName.relation,
							}
						: {
								schemaName: schemaName,
							}),
				};
			})
		)
		.returning(["id", "slug", "name", "schemaName", "isRelation"])
		.execute();
};
