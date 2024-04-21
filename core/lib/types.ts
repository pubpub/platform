import type { Community, Member } from "@prisma/client";

import { Prisma } from "@prisma/client";

export type RecursiveInclude<T extends string, U extends {}> = {
	include: {
		[K in T]: RecursiveInclude<T, U>;
	} & U;
};

export const makeRecursiveInclude = <T extends string, U extends {}>(
	key: T,
	include: U,
	depth: number
): RecursiveInclude<T, U> => {
	if (depth === 0) {
		return { include: { [key]: true, ...include } } as unknown as RecursiveInclude<T, U>;
	}
	return {
		include: {
			[key]: makeRecursiveInclude(key, include, depth - 1),
			...include,
		},
	} as RecursiveInclude<T, U>;
};

export const permissionInclude = {
	member: {
		include: {
			user: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
					avatar: true,
					email: true,
				},
			},
		},
	},
	memberGroup: {
		include: {
			users: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
					avatar: true,
					email: true,
				},
			},
		},
	},
} satisfies Prisma.PermissionInclude;

export const pubValuesInclude = {
	values: {
		distinct: ["fieldId"],
		orderBy: { createdAt: "desc" },
		include: {
			field: {
				include: { schema: true },
			},
		},
	},
} satisfies Prisma.PubInclude;

export const pubInclude = {
	pubType: true,
	...pubValuesInclude,
	stages: {
		include: {
			stage: {
				include: {
					integrationInstances: { include: { integration: true } },
				},
			},
		},
	},
	integrationInstances: { include: { integration: true } },
	claims: { include: { user: true } },
	children: {
		...makeRecursiveInclude(
			"children",
			{
				pubType: true,
				values: { include: { field: true } },
			},
			3
		),
	},
	permissions: { include: permissionInclude },
} satisfies Prisma.PubInclude;

export type PubValuesPayload = Prisma.PubGetPayload<{ include: typeof pubValuesInclude }>;

export type PubPayload = Prisma.PubGetPayload<{ include: typeof pubInclude }>;

export type UserAndMemberships = {
	id: string;
	slug: string;
	firstName: string;
	lastName: string | null;
	avatar: string | null;
	createdAt: Date;
	updatedAt: Date;
	orcid: string | null;
	email: string;
	memberships: Member[];
	isSuperAdmin: boolean;
};

type User = {
	id: string;
	slug: string;
	firstName: string;
	lastName: string | null;
	avatar: string | null;
	createdAt: Date;
	updatedAt: Date;
	orcid: string | null;
	email: string;
	password: string;
};

export type UserPostBody = Pick<User, "firstName" | "lastName" | "email" | "password">;
export type UserPutBody = Pick<User, "firstName" | "lastName">;
export type UserLoginData = Omit<User, "password">;
export type UserSetting = Pick<User, "firstName" | "lastName" | "email" | "slug"> & {
	communities: Community[];
};

export type PermissionPayload = Prisma.PermissionGetPayload<{ include: typeof permissionInclude }>;

export type PermissionPayloadUser = NonNullable<PermissionPayload["member"]>["user"];
export type PermissionPayloadMember = NonNullable<PermissionPayload["member"]>;

export const communityMemberInclude = {
	user: true,
};

export type CommunityMemberPayload = Prisma.MemberGetPayload<{
	include: typeof communityMemberInclude;
}>;

export const stageInclude = {
	actionInstances: true,
	pubs: { include: { pub: { include: pubInclude } } },
	integrationInstances: { include: { integration: true } },
	permissions: { include: permissionInclude },
	moveConstraints: { include: { destination: true } },
	moveConstraintSources: true,
} satisfies Prisma.StageInclude;

export type StagePayload = Prisma.StageGetPayload<{ include: typeof stageInclude }>;
export type StagePayloadActionInstance = StagePayload["actionInstances"][number];
export type StagePayloadAction = StagePayload["actionInstances"][number]["action"];
export type StagesById = { [key: string]: StagePayload };

export type StagePayloadMoveConstraint = NonNullable<StagePayload["moveConstraints"]>;
export type StagePayloadMoveConstraintDestination =
	StagePayloadMoveConstraint[number]["destination"];
export type IntegrationAction = { name: string; url: string; href: string };

export type DeepPartial<T> = T extends object
	? {
			[P in keyof T]?: DeepPartial<T[P]>;
		}
	: T;
