import type { ApiAccessPermissions as NonGenericApiAccessPermissions } from "../public/ApiAccessPermissions";
import type { StagesId } from "../public/Stages";
import ApiAccessScope from "../public/ApiAccessScope";
import ApiAccessType from "../public/ApiAccessType";

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
	scope: ApiAccessScope;
	[ApiAccessType.read]?: Record<string, unknown>;
	[ApiAccessType.write]?: Record<string, unknown>;
	[ApiAccessType.archive]?: Record<string, unknown>;
};

/**
 * The shape of the ApiAccessTokenScopesObject
 */
export type ApiAccessPermissionContraintsObjectShape = {
	[key in ApiAccessScope]: ApiAccessPermissionConstraintsShape;
};

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

export type ApiAccessPermissionConstraintsInput = {
	[K in ApiAccessScope]: {
		[L in ApiAccessType]?: ApiAccessPermissionConstraintsConfig[K] extends never
			? boolean
			: L extends keyof ApiAccessPermissionConstraintsConfig[K]
				? ApiAccessPermissionConstraintsConfig[K][L] | boolean
				: boolean;
	};
};

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
