import prisma from "~/prisma/db";

// TODO: If its the case an integration instance can be attached to a stage without configuring it this should be an upsert
export async function updateIntegrationInstanceConfig(instanceId: string, config: object) {
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
