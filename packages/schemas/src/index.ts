import type { Static } from "@sinclair/typebox";

import { CoreSchemaType } from "db/public";

import * as Schemas from "./schemas";

export function getJsonSchemaByCoreSchemaType<C extends CoreSchemaType>(
	coreSchemaType: C
): (typeof Schemas)[C] {
	return Schemas[coreSchemaType];
}

export type JSONSchemaForCoreSchemaType<C extends CoreSchemaType> = (typeof Schemas)[C];

export type InputTypeForCoreSchemaType<C extends CoreSchemaType> = Static<(typeof Schemas)[C]>;
// 	switch (coreSchemaType) {
// 		case CoreSchemaType.Boolean:
// 			return Boolean;
// 		case CoreSchemaType.DateTime:
// 			return DateTime;
// 		case CoreSchemaType.Email:
// 			return Email;
// 		case CoreSchemaType.FileUpload:
// 			return FileUpload;
// 		case CoreSchemaType.MemberId:
// 			return MemberId;
// 		case CoreSchemaType.Null:
// 			return Null;
// 		case CoreSchemaType.Number:
// 			return Number;
// 		case CoreSchemaType.NumericArray:
// 			return NumericArray;
// 		case CoreSchemaType.String:
// 			return String;
// 		case CoreSchemaType.StringArray:
// 			return StringArray;
// 		case CoreSchemaType.URL:
// 			return URL;
// 		case CoreSchemaType.Vector3:
// 			return Vector3;
// 		case CoreSchemaType.HTML:
// 			return HTML;
// 		case CoreSchemaType.ContextString:
// 			return ContextString;
// 		default:
// 			const _exhaustiveCheck: never = coreSchemaType;
// 			return _exhaustiveCheck;
// 	}
// }

const DefaultValueSchemaTypeMap = {
	[CoreSchemaType.Boolean]: undefined,
	[CoreSchemaType.DateTime]: undefined,
	[CoreSchemaType.Email]: "",
	[CoreSchemaType.FileUpload]: undefined,
	[CoreSchemaType.MemberId]: "",
	[CoreSchemaType.Null]: undefined,
	[CoreSchemaType.Number]: undefined,
	[CoreSchemaType.NumericArray]: [],
	[CoreSchemaType.String]: "",
	[CoreSchemaType.StringArray]: [],
	[CoreSchemaType.URL]: "",
	[CoreSchemaType.Vector3]: [0, 50, 100],
	[CoreSchemaType.HTML]: "<div></div>",
	[CoreSchemaType.ContextString]: {
		data: {},
		html: "<div></div>",
	},
} as const satisfies {
	[K in CoreSchemaType]: Static<(typeof Schemas)[K]> | undefined;
};

export function getDefaultValueByCoreSchemaType<C extends CoreSchemaType>(
	coreSchemaType: C
): (typeof DefaultValueSchemaTypeMap)[C] {
	return DefaultValueSchemaTypeMap[coreSchemaType];
}

export { zodTypeToCoreSchemaType } from "./zodTypesToCoreSchemas";
export { SCHEMA_TYPES_WITH_ICONS } from "./CoreSchemaWithIcons";
export { registerFormats } from "./formats";
export * from "./schemaComponents";
export { setErrorFunction } from "./errors";
