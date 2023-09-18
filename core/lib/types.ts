import { Prisma } from "@prisma/client";

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
} satisfies Prisma.PubInclude;

export type PubPayload = Prisma.PubGetPayload<{ include: typeof pubInclude }>;

export type User = {
	id: string;
	slug: string;
	email: string;
	name: string;
	avatar: string | null;
	createdAt: Date;
	updatedAt: Date;
};
export const permissionInclude = {
	member: {
		include: {
			user: {
				select: {
					id: true,
					name: true,
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
					name: true,
					avatar: true,
					email: true,
				},
			},
		},
	},
} satisfies Prisma.PermissionInclude;

export type PermissionPayload = Prisma.PermissionGetPayload<{ include: typeof permissionInclude }>;

export type PermissionPayloadUser = NonNullable<PermissionPayload["member"]>["user"];

export const stageInclude = {
	pubs: { include: pubInclude },
	integrationInstances: { include: { integration: true } },
	permissions: { include: permissionInclude },
	moveConstraints: { include: { destination: true } },
} satisfies Prisma.StageInclude;

export type StagePayload = Prisma.StageGetPayload<{ include: typeof stageInclude }>;

export type StagePayloadMoveConstraint = NonNullable<StagePayload["moveConstraints"]>;
export type StagePayloadMoveConstraintDestination =
	StagePayloadMoveConstraint[number]["destination"];
