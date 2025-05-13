import type { Static } from "@sinclair/typebox";

import { CoreSchemaType } from "db/public";

import * as Schemas from "./schemas";
import {
	Boolean,
	Color,
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

const schemaMap = {
	[CoreSchemaType.Boolean]: () => Boolean,
	[CoreSchemaType.DateTime]: () => DateTime,
	[CoreSchemaType.Email]: () => Email,
	[CoreSchemaType.FileUpload]: () => FileUpload,
	[CoreSchemaType.MemberId]: () => MemberId,
	[CoreSchemaType.Null]: () => Null,
	[CoreSchemaType.Number]: () => Number,
	[CoreSchemaType.NumericArray]: (config) => getNumericArrayWithMinMax(config),
	[CoreSchemaType.RichText]: () => RichText,
	[CoreSchemaType.String]: () => String,
	[CoreSchemaType.StringArray]: (config) => getStringArrayWithMinMax(config),
	[CoreSchemaType.URL]: () => URL,
	[CoreSchemaType.Vector3]: () => Vector3,
	[CoreSchemaType.Color]: () => Color,
} as const satisfies Record<CoreSchemaType, (config?: unknown) => (typeof Schemas)[CoreSchemaType]>;

export function getJsonSchemaByCoreSchemaType<C extends CoreSchemaType>(
	coreSchemaType: C,
	config?: unknown
) {
	return schemaMap[coreSchemaType](config) as ReturnType<(typeof schemaMap)[C]>;
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
			return null;
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
		case CoreSchemaType.Color:
			return "#000000";
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
