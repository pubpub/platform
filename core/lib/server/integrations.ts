import prisma from "~/prisma/db";

export const setIntegrationInstanceConfig = async (instanceId: string, value) => {
	return await prisma.integrationInstance.update({
		where: {
			id: instanceId,
		},
		data: {
			config: value,
		},
	});
};

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

export const setIntegrationInstanceState = async (instanceId: string, pubId: string, value) => {
	return await prisma.integrationInstanceState.upsert({
		where: {
			pub_instance: {
				instanceId,
				pubId,
			},
		},
		update: {
			value,
		},
		create: {
			instanceId,
			pubId,
			value,
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
			value: true,
		},
	});
};
