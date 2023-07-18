import { Eta } from "eta";
import express from "express";
import { ok as assert } from "node:assert";
import process from "node:process";
import {
	findInstanceConfig,
	getAllInstanceIds,
	makeInstanceConfig,
	updateInstanceConfig,
} from "./config";
import { DataciteError, createDoi, deleteDoi } from "./datacite";
import { ResponseError, UpdatePubError, updatePub } from "./pubpub";

const app = express();
const eta = new Eta({ views: "views" });

app.use(express.json());
app.use(express.static("public"));
app.use("/pubpub-manifest.json", express.static(process.cwd() + "/pubpub-manifest.json"));

// pubpub integration routes

app.get("/configure", async (req, res, next) => {
	try {
		const { instanceId } = req.query;
		assert(typeof instanceId === "string");
		const instanceConfig = (await findInstanceConfig(instanceId)) ?? makeInstanceConfig();
		instanceConfig.password = "";
		res.send(eta.render("configure", { title: "configure", instanceConfig, instanceId }));
	} catch (error) {
		next(error);
	}
});

app.get("/apply", async (req, res, next) => {
	try {
		const { instanceId, pubId } = req.query;
		assert(typeof instanceId === "string");
		assert(typeof pubId === "string");
		const instanceConfig = await findInstanceConfig(instanceId);
		if (instanceConfig) {
			res.send(eta.render("apply", { title: "apply", instanceId, instanceConfig, pubId }));
		} else {
			res.status(400).send("not configured");
		}
	} catch (error) {
		next(error);
	}
});

app.post("/apply", async (req, res, next) => {
	try {
		const { instanceId, pubId } = req.query;
		assert(typeof instanceId === "string");
		assert(typeof pubId === "string");
		const instanceConfig = await findInstanceConfig(instanceId);
		if (instanceConfig) {
			const doi = await createDoi(instanceConfig);
			try {
				await updatePub(instanceId, pubId, { "pubpub/doid": doi });
			} catch (error) {
				await deleteDoi(instanceConfig, doi);
				throw error;
			}
			res.json({ doi });
		} else {
			res.status(400).json({ error: "Instance not configured" });
		}
	} catch (error) {
		next(error);
	}
});

// internal routes

app.put("/configure", async (req, res, next) => {
	try {
		const { instanceId } = req.query;
		const instanceConfig = req.body;
		assert(typeof instanceId === "string");
		await updateInstanceConfig(instanceId, instanceConfig);
		res.send(instanceConfig);
	} catch (error) {
		next(error);
	}
});

app.get("/debug", async (_, res, next) => {
	try {
		const instanceIds = await getAllInstanceIds();
		res.send(eta.render("debug", { title: "debug", instanceIds }));
	} catch (error) {
		next(error);
	}
});

app.use((error: any, _: any, res: any, next: any) => {
	const { cause, constructor } = error;
	switch (constructor) {
		case DataciteError:
			if (cause instanceof ResponseError) {
				switch (cause.cause.status) {
					// DataCite returns:
					// - 404 if credentials are invalid
					// - 500 if credentials are malformatted
					case 403:
					case 404:
					case 500:
						res.status(403).json(error);
						break;
					// Fall back to 502 (Bad Gateway) for other DataCite errors
					default:
						res.status(502).json(error);
						break;
				}
			}
		case UpdatePubError:
			// Use PubPub error status if available
			res.status(cause instanceof ResponseError ? cause.cause.status : 500).json(error);
			break;
	}
	next(error);
});

app.listen(process.env.PORT, () => {
	console.log(`server is running on port ${process.env.PORT}`);
});
