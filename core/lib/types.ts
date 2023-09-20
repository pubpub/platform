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
		return { include: { [key]: false, ...include } } as unknown as RecursiveInclude<T, U>;
	}
	return {
		include: {
			[key]: makeRecursiveInclude(key, include, depth - 1),
			...include,
		},
	} as RecursiveInclude<T, U>;
};

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
} satisfies Prisma.PubInclude;

export type PubPayload = Prisma.PubGetPayload<{ include: typeof pubInclude }>;

export const stageInclude = {
	pubs: { include: pubInclude },
	integrationInstances: { include: { integration: true } },
} satisfies Prisma.StageInclude;

export type StagePayload = Prisma.StageGetPayload<{ include: typeof stageInclude }>;

export type User = {
	id: string;
	slug: string;
	email: string;
	name: string;
	avatar: string | null;
	createdAt: Date;
	updatedAt: Date;
};
