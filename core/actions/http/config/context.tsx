import { createContext } from "react";

import type { PubFieldsId } from "~/kysely/types/public/PubFields";
import type { PubFieldSchemaId } from "~/kysely/types/public/PubFieldSchema";

export type PubField = {
	id: PubFieldsId;
	name: string;
	slug: string;
	pubFieldSchemaId: PubFieldSchemaId | null;
};
export const context = createContext<{
	pubFields: PubField[];
}>({
	pubFields: [],
});
