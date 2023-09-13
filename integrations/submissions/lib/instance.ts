import * as redis from "redis";
import manifest from "../pubpub-integration.json";

export type Instance = {
	pubTypeId: string;
};

// const client = redis.createClient({ url: process.env.REDIS_CONNECTION_STRING });
// const connect = client.connect();

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

export const makeInstance = (): Instance => ({
	pubTypeId: "",
});

export const findInstance = async (instanceId: string) => {
	const instance = await (await db()).get(`${manifest.name}:${instanceId}`);
	return instance ? (JSON.parse(instance) as Instance) : undefined;
};

export const updateInstance = async (instanceId: string, instance: Instance): Promise<Instance> => {
	(await db()).set(`${manifest.name}:${instanceId}`, JSON.stringify(instance));
	return instance;
};

export const getAllInstanceIds = async () =>
	(await (await db()).keys(`${manifest.name}:*`))?.map((key) => key.split(":")[1]);
