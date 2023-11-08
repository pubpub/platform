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

export const pubInclude = {
	pubType: true,
	values: { include: { field: true } },
	stages: {
		include: {
			integrationInstances: { include: { integration: true } },
		},
	},
	integrationInstances: { include: { integration: true } },
	community: {
		include: {
			members: {
				include: {
					user: true,
				},
			},
		},
	},
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

export type PubPayload = Prisma.PubGetPayload<{ include: typeof pubInclude }>;

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
export type UserSettings = Pick<User, "firstName" | "lastName" | "email" | "slug">;

export type PermissionPayload = Prisma.PermissionGetPayload<{ include: typeof permissionInclude }>;

export type PermissionPayloadUser = NonNullable<PermissionPayload["member"]>["user"];

export const stageInclude = {
	pubs: { include: pubInclude },
	integrationInstances: { include: { integration: true } },
	permissions: { include: permissionInclude },
	moveConstraintsTo: { include: { destination: true } },
	moveConstraintFrom: { include: { destination: true } },
} satisfies Prisma.StageInclude;

export type StagePayload = Prisma.StageGetPayload<{ include: typeof stageInclude }>;

export type StagePayloadMoveConstraint = NonNullable<StagePayload["moveConstraintsTo"]>;
export type StagePayloadMoveConstraintDestination =
	StagePayloadMoveConstraint[number]["destination"];

export type IntegrationAction = { name: string; url: string; href: string };
