import type { IntegrationInstanceState, User } from "@prisma/client";
import type { InputJsonValue } from "@prisma/client/runtime/library";

import { Prisma } from "@prisma/client";

import type { CreatePubRequestBodyWithNulls, GetPubTypeResponseBody } from "contracts";

import prisma from "~/prisma/db";
import { slugifyString } from "../string";
import { ForbiddenError, NotFoundError } from "./errors";

// queries that are only used in the legacy integrations api

const InstanceNotFoundError = new NotFoundError("Integration instance not found");
const PubFieldSlugsNotFoundError = new NotFoundError("Pub fields not found");

export async function findOrCreateUser(userId: string): Promise<User>;
export async function findOrCreateUser(
	email: string,
	firstName: string,
	lastName?: string
): Promise<User>;
export async function findOrCreateUser(
	userIdOrEmail: string,
	firstName?: string,
	lastName?: string
): Promise<User> {
	let user: User;
	if (typeof firstName === "undefined") {
		// Find user by id
		const dbUser = await prisma.user.findUnique({ where: { id: userIdOrEmail } });
		if (!dbUser) {
			throw new NotFoundError(`User ${userIdOrEmail} not found`);
		}
		user = dbUser;
	} else {
		// Find or create user by email
		const dbUser = await prisma.user.findUnique({ where: { email: userIdOrEmail } });
		if (dbUser) {
			user = dbUser;
		} else {
			try {
				user = await prisma.user.create({
					data: {
						email: userIdOrEmail,
						slug: slugifyString(userIdOrEmail),
						firstName,
						lastName,
					},
				});
			} catch (cause) {
				throw new Error(`Unable to create user for ${userIdOrEmail}`, { cause });
			}
		}
	}
	return user;
}

export const _getPubType = async (pubTypeId: string): Promise<GetPubTypeResponseBody> => {
	const pubType = await prisma.pubType.findUnique({
		where: { id: pubTypeId },
		select: {
			id: true,
			name: true,
			description: true,
			fields: {
				select: {
					id: true,
					name: true,
					slug: true,
					schema: {
						select: {
							id: true,
							namespace: true,
							name: true,
							schema: true,
						},
					},
				},
			},
		},
	});
	if (!pubType) {
		throw new NotFoundError("Pub Type not found");
	}
	return pubType;
};

export const getSuggestedMembers = async (
	email?: string,
	firstName?: string,
	lastName?: string
) => {
	const OR: any[] = [];
	if (firstName) {
		OR.push({
			firstName: {
				contains: firstName,
				mode: "insensitive",
			},
		});
	}
	if (lastName) {
		OR.push({
			lastName: {
				contains: lastName,
				mode: "insensitive",
			},
		});
	}
	if (email) {
		OR.push({
			email: {
				equals: email,
				mode: "insensitive",
			},
		});
	}
	const members = await prisma.user.findMany({
		where: {
			OR,
		},
		take: 10,
		select: {
			id: true,
			email: true,
			slug: true,
			avatar: true,
			firstName: true,
			lastName: true,
			createdAt: true,
		},
	});
	return members;
};

export type SuggestedUser = Awaited<ReturnType<typeof getSuggestedMembers>>[0];

export const getMembers = async (userIds: string[]) => {
	const members = await prisma.user.findMany({
		where: {
			id: {
				in: userIds,
			},
		},
		select: {
			id: true,
			slug: true,
			avatar: true,
			firstName: true,
			lastName: true,
			createdAt: true,
		},
	});
	return members;
};

// pubs

const toJSONNull = (json: CreatePubRequestBodyWithNulls["values"][1]): InputJsonValue => {
	if (json === null) {
		return Prisma.JsonNull as unknown as InputJsonValue;
	} else if (Array.isArray(json)) {
		return json.map(toJSONNull);
	} else if (typeof json === "object" && json !== null) {
		return Object.fromEntries(Object.entries(json).map(([k, v]) => [k, toJSONNull(v)]));
	}
	return json;
};

const normalizePubValues = async (
	values: CreatePubRequestBodyWithNulls["values"],
	pubTypeId?: string
) => {
	const pubFieldSlugs = Object.keys(values);
	const pubFieldIds = await prisma.pubField.findMany({
		where: {
			slug: {
				in: pubFieldSlugs,
			},
			pubTypes: {
				some: {
					id: pubTypeId,
				},
			},
		},
	});

	if (!pubFieldIds) {
		throw PubFieldSlugsNotFoundError;
	}

	const normalizedValues = pubFieldIds.map((field) => {
		const value = toJSONNull(values[field.slug]);
		return {
			fieldId: field.id,
			value,
		};
	});

	return normalizedValues;
};

const getUpdateDepth = (body: CreatePubRequestBodyWithNulls, depth = 0) => {
	if (!body.children) {
		return depth;
	}
	for (const child of body.children) {
		depth = Math.max(getUpdateDepth(child, depth), depth);
	}
	return depth + 1;
};

const makePubChildrenCreateOptions = async (
	body: CreatePubRequestBodyWithNulls,
	communityId: string
) => {
	if (!body.children) {
		return undefined;
	}
	const inputs: ReturnType<typeof makeRecursivePubUpdateInput>[] = [];
	for (const child of body.children) {
		if ("id" in child) {
			continue;
		}
		inputs.push(
			makeRecursivePubUpdateInput({ assigneeId: body.assigneeId, ...child }, communityId)
		);
	}
	return Promise.all(inputs);
};

const makePubChildrenConnectOptions = (body: CreatePubRequestBodyWithNulls) => {
	if (!body.children) {
		return undefined;
	}
	const connect: Prisma.PubWhereUniqueInput[] = [];
	for (const child of body.children) {
		if ("id" in child) {
			connect.push({ id: child.id });
		}
	}
	return connect;
};

/** Build a Prisma `PubCreateInput` object used to create a pub with descendants. */
const makeRecursivePubUpdateInput = async (
	body: CreatePubRequestBodyWithNulls,
	communityId: string
): Promise<Prisma.PubCreateInput> => {
	const assignee = body.assigneeId
		? {
				connect: { id: body.assigneeId },
			}
		: undefined;
	return {
		community: { connect: { id: communityId } },
		pubType: { connect: { id: body.pubTypeId } },
		values: {
			createMany: {
				data: await normalizePubValues(body.values),
			},
		},
		assignee,
		children: {
			// For each child, either connect to an existing pub or create a new one.
			connect: makePubChildrenConnectOptions(body),
			create: await makePubChildrenCreateOptions(body, communityId),
		},
		...(body.parentId && { parent: { connect: { id: body.parentId } } }),
	};
};
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
		where: {
			field: {
				isRelation: false,
			},
		},
	},
} satisfies Prisma.PubInclude;

export type PubValuesPayload = Prisma.PubGetPayload<{ include: typeof pubValuesInclude }>;

export type PubPayload = Prisma.PubGetPayload<{ include: typeof pubInclude }>;
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
	children: {
		...makeRecursiveInclude(
			"children",
			{
				pubType: true,
				values: { include: { field: true } },
				stages: { include: { stage: true } },
			},
			3
		),
	},
	permissions: { include: permissionInclude },
} satisfies Prisma.PubInclude;

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

export const createPub = async (instanceId: string, body: CreatePubRequestBodyWithNulls) => {
	const instance = await prisma.integrationInstance.findUnique({
		where: { id: instanceId },
	});

	if (!instance) {
		throw InstanceNotFoundError;
	}

	if (!instance.stageId) {
		throw new ForbiddenError("Integration instance not attached to stage");
	}

	const updateDepth = getUpdateDepth(body);
	const updateInput = await makeRecursivePubUpdateInput(body, instance.communityId);
	const createArgs = {
		data: {
			...updateInput,
			...(!body.parentId && {
				stages: {
					create: {
						stageId: instance.stageId,
					},
				},
			}),
		},
		...makeRecursiveInclude("children", {}, updateDepth),
	};
	const pub = await prisma.pub.create(createArgs);

	return pub;
};

export const updatePub = async (instanceId: string, body: CreatePubRequestBodyWithNulls) => {
	const instance = await prisma.integrationInstance.findUnique({
		where: { id: instanceId },
	});

	if (!instance) {
		throw InstanceNotFoundError;
	}

	const updateDepth = getUpdateDepth(body);
	const updateInput = await makeRecursivePubUpdateInput(body, instance.communityId);
	const updateArgs = {
		data: {
			...updateInput,
		},
		...makeRecursiveInclude("children", {}, updateDepth),
	};
	const pub = await prisma.pub.update({
		where: { id: body.id },
		...updateArgs,
	});

	return pub;
};

export async function setIntegrationInstanceConfig(instanceId: string, config: object) {
	return await prisma.integrationInstance.update({
		where: {
			id: instanceId,
		},
		data: {
			config,
		},
	});
}

export const getIntegrationInstanceConfig = async (instanceId: string) => {
	const instance = await prisma.integrationInstance.findFirst({
		where: {
			id: instanceId,
		},
		select: {
			config: true,
		},
	});
	return instance?.config ?? null;
};

export const setIntegrationInstanceState = async (
	instanceId: string,
	pubId: string,
	state: IntegrationInstanceState
) => {
	return await prisma.integrationInstanceState.upsert({
		where: {
			pub_instance: {
				instanceId,
				pubId,
			},
		},
		update: {
			state,
		},
		create: {
			instanceId,
			pubId,
			state,
		},
	});
};

export const getIntegrationInstanceState = async (instanceId: string, pubId: string) => {
	const state = await prisma.integrationInstanceState.findUnique({
		where: {
			pub_instance: {
				instanceId,
				pubId,
			},
		},
		select: {
			state: true,
		},
	});
	return state?.state ?? null;
};
