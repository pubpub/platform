import type { Static, TSchema } from "@sinclair/typebox";

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

const SCHEMA_TYPE_SCHEMA_MAP = {
	[CoreSchemaType.Boolean]: (config: unknown) => Boolean,
	[CoreSchemaType.DateTime]: (config: unknown) => DateTime,
	[CoreSchemaType.Email]: (config: unknown) => Email,
	[CoreSchemaType.FileUpload]: (config: unknown) => FileUpload,
	[CoreSchemaType.MemberId]: (config: unknown) => MemberId,
	[CoreSchemaType.Null]: (config: unknown) => Null,
	[CoreSchemaType.Number]: (config: unknown) => Number,
	[CoreSchemaType.NumericArray]: getNumericArrayWithMinMax,
	[CoreSchemaType.RichText]: (config: unknown) => RichText,
	[CoreSchemaType.String]: (config: unknown) => String,
	[CoreSchemaType.StringArray]: getStringArrayWithMinMax,
	[CoreSchemaType.URL]: (config: unknown) => URL,
	[CoreSchemaType.Vector3]: (config: unknown) => Vector3,
} as const satisfies Record<CoreSchemaType, (config: unknown) => TSchema>;

export type JSONSchemaForCoreSchemaType<C extends CoreSchemaType> = ReturnType<
	(typeof SCHEMA_TYPE_SCHEMA_MAP)[C]
>;

export function getJsonSchemaByCoreSchemaType<T extends CoreSchemaType>(
	coreSchemaType: T,
	config?: unknown
) {
	return SCHEMA_TYPE_SCHEMA_MAP[coreSchemaType](config) as JSONSchemaForCoreSchemaType<T>;
}

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
