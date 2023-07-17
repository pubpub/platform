import { ok as assert } from "node:assert";
import process from "node:process";
import express from "express";
import redis from "redis";
import { Eta } from "eta";
import { InstanceConfig } from "./types";
import { updateWordCount } from "./pubpub";

const db = redis.createClient({ url: process.env.REDIS_URL });
const app = express();
const eta = new Eta({ views: "views", cache: true });

const makeDefaultInstanceConfig = (): InstanceConfig => ({ words: false, lines: false });

try {
	await db.connect();
} catch (error) {
	console.log("failed to connect to redis");
	console.error(error);
	process.exit(1);
}

const findConfigByInstanceId = (instanceId: string) =>
	db.get(instanceId).then((value) => (value ? JSON.parse(value) : undefined)) as Promise<
		InstanceConfig | undefined
	>;

app.use(express.json());
app.use(express.static("public"));

// pubpub integration routes

app.get("/configure", async (req, res) => {
	const { instanceId } = req.query;
	assert(typeof instanceId === "string");
	const config = (await findConfigByInstanceId(instanceId)) ?? makeDefaultInstanceConfig();
	res.send(eta.render("configure", { title: "configure", config, instanceId }));
});

app.get("/apply", async (req, res) => {
	const { instanceId, pubId } = req.query;
	assert(typeof instanceId === "string");
	assert(typeof pubId === "string");
	const config = await findConfigByInstanceId(instanceId);
	if (config) {
		res.send(eta.render("apply", { title: "apply", instanceId, config, pubId }));
	} else {
		res.status(400).send("not configured");
	}
});

// internal routes

app.put("/configure", async (req, res) => {
	const { instanceId } = req.query;
	const config = req.body;
	assert(typeof instanceId === "string");
	await db.set(instanceId, JSON.stringify(config));
	res.send(config);
});

app.post("/apply", async (req, res, next) => {
	const { instanceId, pubId } = req.query;
	assert(typeof instanceId === "string");
	assert(typeof pubId === "string");
	const config = await findConfigByInstanceId(instanceId);
	if (config) {
		const counts = await updateWordCount(instanceId, pubId, config);
		res.json(counts);
	} else {
		res.status(400).json({ error: "instance not configured" });
	}
});

app.listen(process.env.PORT, () => {
	console.log(`server is running on port ${process.env.PORT}`);
});
