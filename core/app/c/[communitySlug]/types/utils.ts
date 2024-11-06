import { CoreSchemaType } from "db/public";

export const pubFieldCanBeTitle = (pubField: { schemaName: CoreSchemaType | null }) => {
	return (
		pubField.schemaName === CoreSchemaType.String ||
		pubField.schemaName === CoreSchemaType.Email ||
		pubField.schemaName === CoreSchemaType.URL
	);
};
