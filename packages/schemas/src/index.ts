import { CoreSchemaType } from "db/public";

import { Boolean, DateTime, Email, FileUpload, MemberId, String, URL, Vector3 } from "./schemas";

export function getJsonSchemaByCoreSchemaType(coreSchemaType: CoreSchemaType) {
	switch (coreSchemaType) {
		case CoreSchemaType.String:
			return String;
		case CoreSchemaType.Boolean:
			return Boolean;
		case CoreSchemaType.Vector3:
			return Vector3;
		case CoreSchemaType.DateTime:
			return DateTime;
		case CoreSchemaType.Email:
			return Email;
		case CoreSchemaType.URL:
			return URL;
		case CoreSchemaType.MemberId:
			return MemberId;
		case CoreSchemaType.FileUpload:
			return FileUpload;
	}
}

export { zodTypeToCoreSchemaType } from "./zodTypesToCoreSchemas";
export { SCHEMA_TYPES_WITH_ICONS } from "./CoreSchemaWithIcons";
export { registerFormats } from "./formats";
export * from "./schemaComponents";
export { setErrorFunction } from "./errors";
