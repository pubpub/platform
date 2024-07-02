import type { z } from "zod";

import { CoreSchemaType } from "@prisma/client";

const zodStringTypes = ["ZodString", "ZodLiteral", "ZodEnum"];

const isZodString = (zodType: z.ZodTypeAny): zodType is z.ZodString => {
	return zodType._def.typeName === "ZodString";
};

export const zodTypeToCoreSchemaType = <Z extends z.ZodTypeAny>(zodType: Z) => {
	if (
		"typeName" in zodType._def &&
		["ZodOptional", "ZodNullable", "ZodDefault"].includes(zodType._def.typeName)
	) {
		return zodTypeToCoreSchemaType(zodType._def.innerType);
	}

	if (zodStringTypes.includes(zodType._def.typeName)) {
		if (isZodString(zodType)) {
			if (zodType.isUUID) {
				return CoreSchemaType.UserId;
			}

			if (zodType.isEmail) {
				return CoreSchemaType.Email;
			}

			if (zodType.isURL) {
				return CoreSchemaType.URL;
			}
		}

		return CoreSchemaType.String;
	}

	if (zodType._def.typeName === "ZodDate") {
		return CoreSchemaType.DateTime;
	}

	if (zodType._def.typeName === "ZodBoolean") {
		return CoreSchemaType.Boolean;
	}

	return CoreSchemaType.String;
};
