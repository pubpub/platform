import type { CoreSchemaType } from "db/public";

export interface ElementProps {
	name: string;
	config: any;
	schemaName: CoreSchemaType;
}
