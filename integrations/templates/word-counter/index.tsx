import { ok as assert } from "node:assert";
import process from "node:process";
import express from "express";
import redis from "redis";
import bodyParser from "body-parser";
import { Configure, Apply } from "./pages";
import { InstanceConfig } from "./types";
import { updateWordCount } from "./pubpub";
import { NotConfigured } from "./pages/NotConfigured";

const db = redis.createClient({ url: process.env.REDIS_URL });
const app = express();
const api = express.Router();
const integration = express.Router();

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

app.use(bodyParser.json());
app.use(express.static("public"));

integration.get("/configure", async (req, res) => {
	const { instanceId } = req.query;
	assert(typeof instanceId === "string");
	const instanceConfig = await findConfigByInstanceId(instanceId);
	const instance = { id: instanceId, config: instanceConfig ?? makeDefaultInstanceConfig() };
	res.send(<Configure instance={instance} />);
});

integration.get("/apply", async (req, res) => {
	const { instanceId, pubId } = req.query;
	assert(typeof instanceId === "string");
	assert(typeof pubId === "string");
	const instanceConfig = await findConfigByInstanceId(instanceId);
	if (instanceConfig) {
		const instance = { id: instanceId, config: instanceConfig };
		res.send(<Apply instance={instance} pubId={pubId} />);
	} else {
		res.status(400).send(<NotConfigured />);
	}
});

integration.post("/apply", async (req, res, next) => {
	const { instanceId, pubId } = req.query;
	assert(typeof instanceId === "string");
	assert(typeof pubId === "string");
	const instanceConfig = await findConfigByInstanceId(instanceId);
	if (instanceConfig) {
		const counts = await updateWordCount(instanceId, pubId, instanceConfig);
		res.json(counts);
	} else {
		res.status(400).json({ error: "instance not configured" });
	}
});

api.put("/instance/:instanceId", async (req, res) => {
	const { instanceId } = req.params;
	const config = req.body;
	await db.set(instanceId, JSON.stringify(config));
	res.send(config);
});

app.use("/api", api);
app.use(integration);

app.listen(process.env.PORT, () => {
	console.log(`server is running on port ${process.env.PORT}`);
});
