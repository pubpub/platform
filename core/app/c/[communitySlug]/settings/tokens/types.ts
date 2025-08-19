import type { UseFormReturn } from "react-hook-form";

import { z } from "zod";

import { apiAccessTokensInitializerSchema } from "db/public";
import { permissionsSchema } from "db/types";

export const createTokenFormSchema = apiAccessTokensInitializerSchema
	.omit({
		communityId: true,
		issuedById: true,
	})
	.extend({
		name: z.string().min(1, "Name is required").max(255, "Name is too long"),
		description: z.string().max(255).optional(),
		token: apiAccessTokensInitializerSchema.shape.token.optional(),
		expiration: z
			.date()
			.max(
				new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
				"Maximum expiration date is 1 year in the future"
			)
			.min(new Date(), "Expiry date cannot be in the past"),
		permissions: permissionsSchema,
	})
	.superRefine((data, ctx) => {
		if (
			Object.values(data.permissions)
				.flatMap((scope) => Object.values(scope))
				.filter((value) => value).length > 0
		) {
			return true;
		}
		ctx.addIssue({
			path: ["permissions"],
			code: z.ZodIssueCode.custom,

			message: "At least one permission must be selected",
		});
		return false;
	});

export type CreateTokenFormSchema = z.infer<typeof createTokenFormSchema>;
export type CreateTokenForm = UseFormReturn<CreateTokenFormSchema>;
