"use server";

import type { FormsId } from "~/kysely/types/public/Forms";
import type { PubTypesId } from "~/kysely/types/public/PubTypes";
import { db } from "~/kysely/database";
import { defineServerAction } from "~/lib/server/defineServerAction";

export const createForm = defineServerAction(async function createForm({
	id,
	name,
	pubTypeId,
}: {
	id: FormsId;
	name: string;
	pubTypeId: PubTypesId;
}) {
	const result = await db
		.insertInto("forms")
		.values({
			id,
			name,
			pubTypeId,
		})
		.execute();
	return result;
});

export const deleteForm = defineServerAction(async function deleteForm(id: FormsId) {
	throw new Error("Not implemented");
});
