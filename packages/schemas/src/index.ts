import type { Static } from "@sinclair/typebox";

import { CoreSchemaType } from "db/public";

import * as Schemas from "./schemas";
import {
	Boolean,
	DateTime,
	Email,
	FileUpload,
	getNumericArrayWithMinMax,
	getStringArrayWithMinMax,
	MemberId,
	Null,
	Number,
	RichText,
	String,
	URL,
	Vector3,
} from "./schemas";

export function getJsonSchemaByCoreSchemaType(coreSchemaType: CoreSchemaType, config?: unknown) {
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
			return getNumericArrayWithMinMax(config);
		case CoreSchemaType.RichText:
			return RichText;
		case CoreSchemaType.String:
			return String;
		case CoreSchemaType.StringArray:
			return getStringArrayWithMinMax(config);
		case CoreSchemaType.URL:
			return URL;
		case CoreSchemaType.Vector3:
			return Vector3;
		default:
			const _exhaustiveCheck: never = coreSchemaType;
			return _exhaustiveCheck;
	}
}

export type JSONSchemaForCoreSchemaType<C extends CoreSchemaType> = (typeof Schemas)[C];

export type InputTypeForCoreSchemaType<C extends CoreSchemaType> = Static<(typeof Schemas)[C]>;

export function getDefaultValueByCoreSchemaType(coreSchemaType: CoreSchemaType) {
	switch (coreSchemaType) {
		case CoreSchemaType.Boolean:
			return undefined;
		case CoreSchemaType.DateTime:
			return undefined;
		case CoreSchemaType.Email:
			return "";
		case CoreSchemaType.FileUpload:
			return undefined;
		case CoreSchemaType.MemberId:
			return "";
		case CoreSchemaType.Null:
			return undefined;
		case CoreSchemaType.Number:
			return undefined;
		case CoreSchemaType.NumericArray:
			return [];
		case CoreSchemaType.RichText:
			return undefined;
		case CoreSchemaType.String:
			return "";
		case CoreSchemaType.StringArray:
			return [];
		case CoreSchemaType.URL:
			return "";
		case CoreSchemaType.Vector3:
			return [0, 50, 100];
		default:
			const _exhaustiveCheck: never = coreSchemaType;
			return _exhaustiveCheck;
	}
}

export { zodTypeToCoreSchemaType } from "./zodTypesToCoreSchemas";
export { SCHEMA_TYPES_WITH_ICONS } from "./CoreSchemaWithIcons";
export { registerFormats } from "./formats";
export * from "./schemaComponents";
export * from "./types";
export { setErrorFunction } from "./errors";
