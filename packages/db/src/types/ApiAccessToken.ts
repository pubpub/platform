// temporary until the db types are moved to a separate package again

import type { Prettify } from "@ts-rest/core"
import type { ApiAccessPermissions as NonGenericApiAccessPermissions } from "../public/ApiAccessPermissions"
import type { ApiAccessType } from "../public/ApiAccessType"
import type { PubTypesId } from "../public/PubTypes"
import type { Stages, StagesId } from "../public/Stages"

import { z } from "zod"

import { ApiAccessScope } from "../public/ApiAccessScope"
import { pubTypesIdSchema } from "../public/PubTypes"
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

export const NO_STAGE_OPTION = {
	label: "[Pubs with no stage]",
	value: "no-stage",
} as const

export const stageConstraintSchema = z.union([z.literal(NO_STAGE_OPTION.value), stagesIdSchema])

export type StageConstraint = z.infer<typeof stageConstraintSchema>

export const permissionsSchema = z.object({
	[ApiAccessScope.community]: z.object({
		read: z.boolean().optional(),
		write: z.boolean().optional(),
		archive: z.boolean().optional(),
	}),
	[ApiAccessScope.stage]: z.object({
		read: z
			.object({
				stages: z.array(stageConstraintSchema),
			})
			.or(z.boolean())
			.optional(),
		write: z.boolean().optional(),
		archive: z.boolean().optional(),
	}),
	[ApiAccessScope.pub]: z.object({
		read: z
			.object({
				stages: z.array(stageConstraintSchema),
				pubTypes: z.array(pubTypesIdSchema),
			})
			.or(z.boolean())
			.optional(),
		write: z
			.object({
				stages: z.array(stageConstraintSchema),
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
	stages: {
		stages: Stages[]
		allOptions: [typeof NO_STAGE_OPTION, ...{ label: string; value: StagesId }[]]
		allValues: [typeof NO_STAGE_OPTION.value, ...StagesId[]]
	}
	pubTypes: {
		pubTypes: { id: PubTypesId; name: string }[]
		allOptions: { label: string; value: PubTypesId }[]
		allValues: PubTypesId[]
	}
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
> = T extends T // which is much harder to work with // { objectType: 'Pub' | 'Stage' |..., accessType: 'WRITE' | 'READ' | ..., constraints: { stages: [] } | ... } // without it, it would look like // like { objectType: 'Pub', accessType: 'WRITE', constraints: { stages: [] } } | { objectType: 'Stage', accessType: 'READ', constraints: { stages: [] } } | ... // this "spreading" is necessary to create a discriminated union
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
