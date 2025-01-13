// temporary until the db types are moved to a separate package again

import type { Prettify } from "@ts-rest/core"

import { z } from "zod"

import type { ApiAccessPermissions as NonGenericApiAccessPermissions } from "../public/ApiAccessPermissions"
import type { ApiAccessType } from "../public/ApiAccessType"
import type { Stages } from "../public/Stages"
import { ApiAccessScope } from "../public/ApiAccessScope"
import { stagesIdSchema } from "../public/Stages"

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
	[ApiAccessType.read]?: Record<string, unknown> | boolean
	[ApiAccessType.write]?: Record<string, unknown> | boolean
	[ApiAccessType.archive]?: Record<string, unknown> | boolean
}

/**
 * The shape of the ApiAccessTokenScopesObject
 */
export type ApiAccessPermissionContraintsObjectShape = {
	[key in ApiAccessScope]: ApiAccessPermissionConstraintsShape
}

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
}) satisfies z.Schema<ApiAccessPermissionContraintsObjectShape>

export type CreateTokenFormContext = {
	stages: Stages[]
}

export type ApiAccessPermissionConstraintsInput = z.infer<typeof permissionsSchema>

export type ApiAccessPermissionConstraints<
	T extends ApiAccessScope = ApiAccessScope,
	AT extends ApiAccessType = ApiAccessType,
	C extends z.infer<typeof permissionsSchema> = z.infer<typeof permissionsSchema>,
> = T extends T
	? C[T] extends boolean | undefined
		? undefined
		: AT extends AT
			? C[T] extends {
					[K in AT]?: infer R
				}
				? Exclude<R, boolean | undefined>
				: C[T]
			: never
	: never

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
			? Prettify<
					Omit<
						NonGenericApiAccessPermissions,
						"objectType" | "constraints" | "accessType"
					> & {
						accessType: AT
						objectType: T
						constraints: ApiAccessPermissionConstraints<T, AT> | null
					}
				>
			: never
		: never
