import prisma from "~/prisma/db";
import { InstanceNotFoundError } from "./errors";

export async function updateIntegrationInstanceConfig(instanceId: string, config: object) {
	const instance = await prisma.integrationInstance.findUnique({
		where: {
			id: instanceId,
		},
	});

	if (!instance) {
		throw InstanceNotFoundError;
	}
	return await prisma.integrationInstance.upsert({
		where: {
			id: instanceId,
		},
		update: {
			config,
		},
		create: {
			id: instanceId,
			config,
			integrationId: instance.integrationId,
			communityId: instance.communityId,
			name: instance.name,
		},
	});
}

export const getIntegrationInstanceConfig = async (instanceId: string) => {
	return await prisma.integrationInstance.findFirst({
		where: {
			id: instanceId,
		},
		select: {
			config: true,
		},
	});
};

export const setIntegrationInstanceState = async (instanceId: string, pubId: string, state) => {
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
	return await prisma.integrationInstanceState.findUnique({
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
};
