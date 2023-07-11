import process from "node:process";
import express from "express";
import redis from "redis";
import bodyParser from "body-parser";

const app = express();
const db = redis.createClient();
const integration = express.Router();

await db.connect();

app.use(bodyParser.urlencoded());
app.use(express.static("public"));

integration.get("/:integrationId/configure", async (req, res, next) => {
	try {
		if (await db.get(req.params.integrationId)) {
			res.sendFile(process.cwd() + "/pages/configure-complete.html");
		} else {
			res.sendFile(process.cwd() + "/pages/configure.html");
		}
	} catch (error) {
		next(error);
	}
});

integration.post("/:integrationId/configure", async (req, res, next) => {
	try {
		await db.set(req.params.integrationId, JSON.stringify(req.body));
		res.redirect(`/integration/${req.params.integrationId}/configure`);
	} catch (error) {
		next(error);
	}
});

integration.get("/:integrationId/pub/:pubId", async (req, res, next) => {
	try {
		const config = await db.get(req.params.integrationId);
		if (config === null) {
			res.status(404).send("Integration not configured");
		} else {
			res.status(200).json({ pubId: req.params.pubId, config: JSON.parse(config) });
		}
	} catch (error) {
		next(error);
	}
});

app.use("/integration", integration);

app.all("*", (req, res) => {
	res.status(404).send("Not Found");
});

app.listen(process.env.PORT, () => {
	console.log(`server is running on port ${process.env.PORT}`);
});
