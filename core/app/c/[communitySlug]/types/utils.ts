import { CoreSchemaType } from "db/public"

export const pubFieldCanBeTitle = (pubField: {
	schemaName: CoreSchemaType | null
	isRelation?: boolean | null
}) => {
	return (
		!pubField.isRelation &&
		(pubField.schemaName === CoreSchemaType.String ||
			pubField.schemaName === CoreSchemaType.Email ||
			pubField.schemaName === CoreSchemaType.URL)
	)
}
