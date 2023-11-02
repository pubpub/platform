import * as redis from "redis";
import { client } from "~/lib/pubpub";

export type EmailTemplate = { subject: string; message: string };

export type InstanceConfig = {
	pubTypeId: string;
	template: EmailTemplate;
};

export type InstanceState = {
	[userId: string]: {
		inviteTemplate: EmailTemplate;
		inviteTime: string;
	};
};

// let client: redis.RedisClientType;
// let clientConnect: Promise<void>;

// const db = async () => {
// 	if (!client) {
// 		client = redis.createClient({ url: process.env.REDIS_CONNECTION_STRING });
// 		clientConnect = client.connect();
// 	}
// 	await clientConnect;
// 	return client;
// };

export const makeInstanceConfig = (): InstanceConfig => ({
	pubTypeId: "",
	template: { subject: "", message: "" },
});

export const getInstanceConfig = async (instanceId: string) => {
	const instanceConfig = await client.getInstanceConfig(instanceId);
	return instanceConfig ? (JSON.parse(instanceConfig) as any) : undefined;
};

export const setInstanceConfig = async (instanceId: string, instance: any): Promise<any> => {
	return await client.setInstanceConfig(instanceId, JSON.stringify(instance));
};

export const getInstanceState = async (instanceId: string, pubId: string) => {
	const instanceState = await client.getInstanceState(instanceId, pubId);
	return instanceState ? (JSON.parse(instanceState) as any) : undefined;
};

export const setInstanceState = async (
	instanceId: string,
	pubId: string,
	state: any
): Promise<any> => {
	return await client.setInstanceState(instanceId, pubId, JSON.stringify(state));
};
