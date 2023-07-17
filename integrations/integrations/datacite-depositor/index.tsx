import { ok as assert } from "node:assert";
import process from "node:process";
import express from "express";
import redis from "redis";
import { Eta } from "eta";
import { InstanceConfig } from "./types";
import { updatePubFields } from "./pubpub";

const db = redis.createClient({ url: process.env.REDIS_URL });
const app = express();
const eta = new Eta({ views: "views" });

const makeDefaultInstanceConfig = (): InstanceConfig => ({
	accountId: "",
	password: "",
	doiPrefix: "",
});

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
	const instanceConfig = (await findConfigByInstanceId(instanceId)) ?? makeDefaultInstanceConfig();
	res.send(eta.render("configure", { title: "configure", instanceConfig, instanceId }));
});

app.get("/apply", async (req, res) => {
	const { instanceId, pubId } = req.query;
	assert(typeof instanceId === "string");
	assert(typeof pubId === "string");
	const instanceConfig = await findConfigByInstanceId(instanceId);
	if (instanceConfig) {
		res.send(eta.render("apply", { title: "apply", instanceId, instanceConfig, pubId }));
	} else {
		res.status(400).send("not configured");
	}
});

// internal routes

app.put("/configure", async (req, res) => {
	const { instanceId } = req.query;
	const instanceConfig = req.body;
	assert(typeof instanceId === "string");
	await db.set(instanceId, JSON.stringify(instanceConfig));
	res.send(instanceConfig);
});

app.post("/apply", async (req, res) => {
	const { instanceId, pubId } = req.query;
	assert(typeof instanceId === "string");
	assert(typeof pubId === "string");
	const instanceConfig = await findConfigByInstanceId(instanceId);
	if (instanceConfig) {
		const doi = await updatePubFields(instanceId, instanceConfig, pubId);
		res.json({ doi });
	} else {
		res.status(400).json({ error: "instance not configured" });
	}
});

app.listen(process.env.PORT, () => {
	console.log(`server is running on port ${process.env.PORT}`);
});
