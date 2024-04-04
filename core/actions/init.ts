import prisma from "~/prisma/db";
import { CorePubField } from "./corePubFields";
import { Action } from "./types";

export const registerCorePubField = async (corePubField: CorePubField) => {
	// Ensure the field exists in the database and is up to date
	const persistedCorePubField = await prisma.pubField.upsert({
		where: {
			slug: corePubField.slug,
		},
		create: {
			name: corePubField.name,
			slug: corePubField.slug,
			schema: {
				create: corePubField.schema,
			},
		},
		update: {
			name: corePubField.name,
			schema: {
				update: corePubField.schema,
			},
		},
	});
	corePubField.id = persistedCorePubField.id;
};

export const registerAction = async (action: Action) => {
	const pubFieldIds = action.pubFields.map((field) => ({ id: field.id! }));
	// Ensure the action exists in the database and is up to date
	const persistedAction = await prisma.action.upsert({
		where: {
			name: action.name,
		},
		update: {
			description: action.description,
			pubFields: {
				connect: pubFieldIds,
			},
		},
		create: {
			name: action.name,
			description: action.description,
			pubFields: {
				connect: pubFieldIds,
			},
		},
	});
	action.id = persistedAction.id;
};
