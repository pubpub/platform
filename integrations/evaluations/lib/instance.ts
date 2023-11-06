import * as redis from "redis";
// import { client as pubpubClient} from "~/lib/pubpub";

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

let client: redis.RedisClientType;
let clientConnect: Promise<void>;

const db = async () => {
	if (!client) {
		client = redis.createClient({ url: process.env.REDIS_CONNECTION_STRING });
		clientConnect = client.connect();
	}
	await clientConnect;
	return client;
};

export const makeInstanceConfig = (): InstanceConfig => ({
	pubTypeId: "",
	template: { subject: "", message: "" },
});

export const getInstanceConfig = async (instanceId: string) => {
	const instance = await (await db()).get(instanceId);
	return instance ? (JSON.parse(instance) as InstanceConfig) : undefined;
};

export const setInstanceConfig = async (
	instanceId: string,
	instance: InstanceConfig
): Promise<InstanceConfig> => {
	(await db()).set(instanceId, JSON.stringify(instance));
	return instance;
};

export const getInstanceState = async (instanceId: string, pubId: string) => {
	const state = await (await db()).get(`${instanceId}:${pubId}`);
	return state ? (JSON.parse(state) as InstanceState) : undefined;
};

export const setInstanceState = async (
	instanceId: string,
	pubId: string,
	state: InstanceState
): Promise<InstanceState> => {
	(await db()).set(`${instanceId}:${pubId}`, JSON.stringify(state));
	return state;
};
