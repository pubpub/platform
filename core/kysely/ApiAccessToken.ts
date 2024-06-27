// temporary until the db types are moved to a separate package again

import type { useForm } from "react-hook-form";

import { z } from "zod";

import type { ApiAccessPermissions as NonGenericApiAccessPermissions } from "./types/public/ApiAccessPermissions";
import type { ApiAccessTokensId } from "./types/public/ApiAccessTokens";
import type ApiAccessType from "./types/public/ApiAccessType";
import type { CommunitiesId } from "./types/public/Communities";
import type { Stages, StagesId } from "./types/public/Stages";
import type { UsersId } from "./types/public/Users";
import ApiAccessScope from "./types/public/ApiAccessScope";

/**
 * General shape of a generic ApiAccessToken constraint,
 * which is a set of additional constrainst on what the token has access to.
 *
 * If an access type is undefined, it means that the token can do anything with the object
 *
 * If an access type is true, it means that the token can do anything with the object
 *
 * If an access type is false, it means that the token can do nothing with the object
 *
 */
export type ApiAccessPermissionConstraintsShape = {
	/**
	 * Mostly to make creating a discriminated union easier
	 */
	//	scope: ApiAccessScope;
	[ApiAccessType.read]?: Record<string, unknown> | boolean;
	[ApiAccessType.write]?: Record<string, unknown> | boolean;
	[ApiAccessType.archive]?: Record<string, unknown> | boolean;
};

/**
 * The shape of the ApiAccessTokenScopesObject
 */
export type ApiAccessPermissionContraintsObjectShape = {
	[key in ApiAccessScope]: ApiAccessPermissionConstraintsShape;
};

const stagesIdSchema = z.string().uuid() as unknown as z.Schema<StagesId>;
const communitiesIdSchema = z.string().uuid() as unknown as z.Schema<CommunitiesId>;
const usersIdSchema = z.string().uuid() as unknown as z.Schema<UsersId>;
const apiAccessTokensIdSchema = z.string().uuid() as unknown as z.Schema<ApiAccessTokensId>;

export const apiAccessTokensInitializerSchema = z.object({
	id: apiAccessTokensIdSchema.optional(),
	token: z.string(),
	name: z.string(),
	description: z.string().optional().nullable(),
	communityId: communitiesIdSchema,
	expiration: z.date(),
	revoked: z.boolean().optional(),
	issuedById: usersIdSchema,
	issuedAt: z.date().optional(),
	usageLimit: z.number().optional().nullable(),
	usages: z.number().optional(),
});

export const permissionsSchema = z.object({
	[ApiAccessScope.community]: z.object({
		read: z.boolean().optional(),
		write: z.boolean().optional(),
		archive: z.boolean().optional(),
	}),
	[ApiAccessScope.stage]: z.object({
		read: z
			.object({
				stages: z.array(stagesIdSchema),
			})
			.or(z.boolean())
			.optional(),
		write: z.boolean().optional(),
		archive: z.boolean().optional(),
	}),
	[ApiAccessScope.pub]: z.object({
		read: z.boolean().optional(),
		write: z
			.object({
				stages: z.array(stagesIdSchema),
			})
			.or(z.boolean())
			.optional(),
		archive: z.boolean().optional(),
	}),
	[ApiAccessScope.member]: z.object({
		read: z.boolean().optional(),
		write: z.boolean().optional(),
		archive: z.boolean().optional(),
	}),
	[ApiAccessScope.pubType]: z.object({
		read: z.boolean().optional(),
		write: z.boolean().optional(),
		archive: z.boolean().optional(),
	}),
}) satisfies z.Schema<ApiAccessPermissionContraintsObjectShape>;

export const createTokenFormSchema = apiAccessTokensInitializerSchema
	.omit({
		communityId: true,
		usageLimit: true,
		issuedById: true,
	})
	.extend({
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
export type CreateTokenForm = ReturnType<typeof useForm<CreateTokenFormSchema>>;

export type CreateTokenFormContext = {
	stages: Stages[];
};

export type ApiAccessPermissionConstraintsInput = z.infer<typeof permissionsSchema>;

/**
 * The specific constraints for a given ApiAccessTokenScope
 *
 * You need to change this if you want to add additional constraints
 */
export type ApiAccessPermissionConstraintsConfig = {
	[ApiAccessScope.community]: never;
	[ApiAccessScope.stage]: {
		[ApiAccessType.read]: {
			/**
			 * Which stages are readable by this token
			 */
			stages: StagesId[];
		};
	};
	[ApiAccessScope.pub]: {
		[ApiAccessType.write]: {
			/**
			 * In which stages Pubs can be written to by this token
			 */
			stages: StagesId[];
		};
	};
	[ApiAccessScope.member]: never;
	[ApiAccessScope.pubType]: never;
};

export type ApiAccessPermissionConstraints<
	T extends ApiAccessScope = ApiAccessScope,
	AT extends ApiAccessType = ApiAccessType,
	C extends ApiAccessPermissionConstraintsConfig = ApiAccessPermissionConstraintsConfig,
> = T extends T
	? C[T] extends never
		? undefined
		: AT extends AT
			? C[T] extends {
					[K in AT]: infer R;
				}
				? R
				: undefined
			: never
	: never;

/**
 * Use this instead of the standard ApiAccessPermission for better type inference
 */
export type ApiAccessPermission<
	T extends ApiAccessScope = ApiAccessScope,
	AT extends ApiAccessType = ApiAccessType,
> =
	// this "spreading" is necessary to create a discriminated union
	// like { objectType: 'Pub', accessType: 'WRITE', constraints: { stages: [] } } | { objectType: 'Stage', accessType: 'READ', constraints: { stages: [] } } | ...
	// without it, it would look like
	// { objectType: 'Pub' | 'Stage' |..., accessType: 'WRITE' | 'READ' | ..., constraints: { stages: [] } | ... }
	// which is much harder to work with
	T extends T
		? AT extends AT
			? Omit<NonGenericApiAccessPermissions, "objectType" | "constraints" | "accessType"> & {
					accessType: AT;
					objectType: T;
					constraints: ApiAccessPermissionConstraints<T, AT>;
				}
			: never
		: never;
