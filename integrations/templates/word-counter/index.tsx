import { ok as assert } from "node:assert";
import process from "node:process";
import express from "express";
import redis from "redis";
import bodyParser from "body-parser";
import { Configure, Apply } from "./pages";
import { InstanceConfig } from "./types";
import { updateWordCount } from "./pubpub";

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

// integration

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
	const config = await findConfigByInstanceId(instanceId);
	if (!config) {
		res.status(400);
	}
	res.send(<Apply instanceId={instanceId} config={config} />);
});

integration.post("/apply", async (req, res, next) => {
	const { instanceId, pubId } = req.query;
	assert(typeof instanceId === "string");
	assert(typeof pubId === "string");
	next();
});

// implementation

api.put("/instance/:instanceId", async (req, res) => {
	const { instanceId } = req.params;
	const config = req.body;
	res.setHeader("Content-Type", "text/html");
	await db.set(instanceId, JSON.stringify(config));
	res.send(config);
});

api.post("/instance/:instanceId/process/:pubId", async (req, res) => {
	const config = await findConfigByInstanceId(req.params.instanceId);
	if (config) {
		const metrics = await updateWordCount(req.params.instanceId, req.params.pubId, config);
		res.status(200);
		res.json({ success: true, metrics });
	} else {
		res.status(400);
		res.json({ error: "instance not configured" });
	}
});

app.use("/api", api);
app.use(integration);

app.listen(process.env.PORT, () => {
	console.log(`server is running on port ${process.env.PORT}`);
});
