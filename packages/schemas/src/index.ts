import { CoreSchemaType } from "db/public";

import {
	Boolean,
	DateTime,
	Email,
	FileUpload,
	MemberId,
	Null,
	Number,
	NumericArray,
	String,
	StringArray,
	URL,
	Vector3,
} from "./schemas";

export function getJsonSchemaByCoreSchemaType(coreSchemaType: CoreSchemaType) {
	switch (coreSchemaType) {
		case CoreSchemaType.Boolean:
			return Boolean;
		case CoreSchemaType.DateTime:
			return DateTime;
		case CoreSchemaType.Email:
			return Email;
		case CoreSchemaType.FileUpload:
			return FileUpload;
		case CoreSchemaType.MemberId:
			return MemberId;
		case CoreSchemaType.Null:
			return Null;
		case CoreSchemaType.Number:
			return Number;
		case CoreSchemaType.NumericArray:
			return NumericArray;
		case CoreSchemaType.String:
			return String;
		case CoreSchemaType.StringArray:
			return StringArray;
		case CoreSchemaType.URL:
			return URL;
		case CoreSchemaType.Vector3:
			return Vector3;
		default:
			const _exhaustiveCheck: never = coreSchemaType;
			return _exhaustiveCheck;
	}
}

export function getDefaultValueByCoreSchemaType(coreSchemaType: CoreSchemaType) {
	switch (coreSchemaType) {
		case CoreSchemaType.String:
			return "";
		case CoreSchemaType.Boolean:
			return undefined;
		case CoreSchemaType.Vector3:
			return [0, 0, 0];
		case CoreSchemaType.DateTime:
			return undefined;
		case CoreSchemaType.Email:
			return "";
		case CoreSchemaType.URL:
			return "";
		case CoreSchemaType.MemberId:
			return "";
		case CoreSchemaType.FileUpload:
			return undefined;
		case CoreSchemaType.Null:
			return undefined;
		default:
			const _exhaustiveCheck: never = coreSchemaType;
			return _exhaustiveCheck;
	}
}

export { zodTypeToCoreSchemaType } from "./zodTypesToCoreSchemas";
export { SCHEMA_TYPES_WITH_ICONS } from "./CoreSchemaWithIcons";
export { registerFormats } from "./formats";
export * from "./schemaComponents";
export { setErrorFunction } from "./errors";
