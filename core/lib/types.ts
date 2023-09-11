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

export const stageInclude = {
	pubs: { include: pubInclude },
	integrationInstances: { include: { integration: true } },
} satisfies Prisma.StageInclude;

export type StagePayload = Prisma.StageGetPayload<{ include: typeof stageInclude }>;
