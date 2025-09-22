import type {
	ActionConfigDefaults,
	ActionInstances,
	Communities,
	CommunityMemberships,
	PubFields,
	PubFieldsId,
	Pubs,
	PubTypes,
	Users,
} from "db/public";

import type { PubValues } from "./server";
import type { DirectAutoOutput } from "./server/cache/types";

export type UserWithMemberships = Omit<Users, "passwordHash"> & {
	memberships: Omit<CommunityMemberships, "memberGroupId">[];
};

export type UserWithMember = Omit<Users, "passwordHash"> & {
	member?: Omit<CommunityMemberships, "memberGroupId"> | null;
};

export type MemberWithUser = Omit<CommunityMemberships, "memberGroupId"> & {
	user: Omit<Users, "passwordHash">;
};

export type UserPostBody = Pick<Users, "firstName" | "lastName" | "email">;
export type UserPutBody = Pick<Users, "firstName" | "lastName">;
export type UserLoginData = Omit<Users, "passwordHash" | "isProvisional">;
export type UserSetting = Pick<Users, "firstName" | "lastName" | "email" | "slug"> & {
	communities: Communities[];
};

export type PubWithValues = Omit<Pubs, "valuesBlob"> & { values: PubValues };

export type PubTypeWithFieldIds = Pick<PubTypes, "id" | "name" | "description"> & {
	fields: { id: PubFieldsId; isTitle: boolean }[];
};

export type PubField = Pick<
	PubFields,
	| "id"
	| "name"
	| "slug"
	| "updatedAt"
	| "schemaName"
	| "pubFieldSchemaId"
	| "isArchived"
	| "isRelation"
>;

export type AutoReturnType<T extends (...args: any[]) => DirectAutoOutput<any>> = {
	[K in "execute" | "executeTakeFirst" | "executeTakeFirstOrThrow"]: Awaited<
		ReturnType<ReturnType<T>[K]>
	>;
};

export type ActionInstanceWithConfigDefaults = ActionInstances & {
	defaultedActionConfigKeys: string[] | null;
};
