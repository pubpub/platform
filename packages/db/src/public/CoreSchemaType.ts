// @generated
// This file is automatically generated by Kanel. Do not modify manually.

import { z } from "zod";

/** Represents the enum public.CoreSchemaType */
enum CoreSchemaType {
	String = "String",
	Boolean = "Boolean",
	Vector3 = "Vector3",
	DateTime = "DateTime",
	Email = "Email",
	URL = "URL",
	UserId = "UserId",
	FileUpload = "FileUpload",
}

export default CoreSchemaType;

/** Zod schema for CoreSchemaType */
export const coreSchemaTypeSchema = z.nativeEnum(CoreSchemaType);
