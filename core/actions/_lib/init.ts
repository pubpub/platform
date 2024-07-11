import type { CorePubField } from "../corePubFields";
import type { Action } from "../types";
import prisma from "~/prisma/db";

export const registerCorePubField = async (corePubField: CorePubField) => {
	// Ensure the field exists in the database and is up to date
	const persistedCorePubField = await prisma.pubField.upsert({
		where: {
			slug: corePubField.slug,
		},
		create: {
			name: corePubField.name,
			slug: corePubField.slug,
			schemaName: corePubField.schemaName,
			schema: {
				create: corePubField.schema,
			},
		},
		update: {
			name: corePubField.name,
			schemaName: corePubField.schemaName,
			schema: {
				update: corePubField.schema,
			},
		},
	});
	corePubField.id = persistedCorePubField.id;
};
