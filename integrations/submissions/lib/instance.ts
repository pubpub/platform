import * as redis from "redis";
import manifest from "../pubpub-integration.json";

export type Instance = {};

const client = redis.createClient({ url: process.env.REDIS_CONNECTION_STRING });
const connect = client.connect();

const db = async () => {
	await connect;
	return client;
};

export const makeInstance = (): Instance => ({});

export const findInstance = async (instanceId: string) =>
	(await db())
		.get(`${manifest.name}:${instanceId}`)
		.then((value) => (value ? JSON.parse(value) : undefined)) as Promise<Instance | undefined>;

export const updateInstance = async (instanceId: string, instance: Instance) =>
	(await db()).set(`${manifest.name}:${instanceId}`, JSON.stringify(instance));

export const getAllInstanceIds = async () =>
	(await (await db()).keys(`${manifest.name}:*`))?.map((key) => key.split(":")[1]);
