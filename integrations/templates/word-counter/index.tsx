import assert from "node:assert";
import process from "node:process";
import express from "express";
import redis from "redis";
import bodyParser from "body-parser";
import { Instance, NotFound, Process, ProcessComplete, jsx } from "./pages";
import { Metric } from "./types";
import { updateWordCount } from "./pubpub";

const db = redis.createClient({
	url: process.env.REDIS_URL,
});
const app = express();
const router = express.Router();

try {
	await db.connect();
} catch (error) {
	console.log("failed to connect to redis");
	console.error(error);
	process.exit(1);
}

const findMetricByInstanceId = (instanceId: string) => db.get(instanceId) as Promise<Metric | null>;

const makeMetricFromConfig = (config: Metric[] | null) => {
	const configHasWords = config?.includes("words");
	const configHasLines = config?.includes("lines");
	if (configHasWords && configHasLines) return "words-and-lines";
	if (configHasWords) return "words";
	if (configHasLines) return "lines";
	return undefined;
};

app.use(bodyParser.urlencoded());
app.use(express.static("public"));

router.get("/:instanceId", async (req, res) => {
	const metric = (await findMetricByInstanceId(req.params.instanceId)) ?? undefined;
	const processPubId = req.query.processPubId;
	if (processPubId) assert.ok(typeof processPubId === "string");
	res
		.setHeader("Content-Type", "text/html")
		.send(
			<Instance
				metric={metric}
				processPubId={processPubId}
				error={
					processPubId && "The integration instance must be configured before processing this Pub"
				}
			/>
		);
});

router.post("/:instanceId", async (req, res) => {
	const metric = makeMetricFromConfig(req.body.metric);
	res.setHeader("Content-Type", "text/html");
	if (metric) {
		await db.set(req.params.instanceId, metric);
		if (req.query.processPubId) {
			res.redirect(`/instance/${req.params.instanceId}/process/${req.query.processPubId}`);
		} else {
			res.send(<Instance metric={metric} updated />);
		}
	} else {
		res.send(<Instance metric={metric} error="At least one counting metric must be selected" />);
	}
});

router.get("/:instanceId/process/:pubId", async (req, res) => {
	const metric = await findMetricByInstanceId(req.params.instanceId);
	if (metric) {
		res.setHeader("Content-Type", "text/html").send(<Process />);
	} else {
		res.redirect(`/instance/${req.params.instanceId}?processPubId=${req.params.pubId}`);
	}
});

router.post("/:instanceId/process/:pubId", async (req, res) => {
	const metric = await findMetricByInstanceId(req.params.instanceId);
	if (metric) {
		const counts = await updateWordCount(req.params.pubId, metric);
		res.setHeader("Content-Type", "text/html").send(<ProcessComplete {...counts} />);
	} else {
		res.redirect(`/instance/${req.params.instanceId}?processPubId=${req.params.pubId}`);
	}
});

app.use("/instance", router);

app.all("*", (_, res) => {
	res.status(404).send(<NotFound />);
});

app.listen(process.env.PORT, () => {
	console.log(`server is running on port ${process.env.PORT}`);
});
