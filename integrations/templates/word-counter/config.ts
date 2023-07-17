import redis from "redis";

export type InstanceConfig = { words: boolean; lines: boolean };

const db = redis.createClient({ url: process.env.REDIS_URL });

try {
	await db.connect();
} catch (error) {
	console.log("failed to connect to redis");
	console.error(error);
	process.exit(1);
}

export const makeInstanceConfig = (): InstanceConfig => ({ words: false, lines: false });

export const findInstanceConfig = (instanceId: string) =>
	db.get(instanceId).then((value) => (value ? JSON.parse(value) : undefined)) as Promise<
		InstanceConfig | undefined
	>;

export const updateInstanceConfig = (instanceId: string, instanceConfig: InstanceConfig) =>
	db.set(instanceId, JSON.stringify(instanceConfig));
