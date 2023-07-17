import { Eta } from "eta";
import express from "express";
import { ok as assert } from "node:assert";
import process from "node:process";
import { CreateDoiFailureError, updatePubFields } from "./pubpub";
import { findInstanceConfig, makeInstanceConfig, updateInstanceConfig } from "./config";

const app = express();
const eta = new Eta({ views: "views" });

app.use(express.json());
app.use(express.static("public"));

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
			const doi = await updatePubFields(instanceId, instanceConfig, pubId);
			res.json({ doi });
		} else {
			res.status(400).json({ error: "instance not configured" });
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

app.use((error: any, _: any, res: any, next: any) => {
	switch (error.constructor) {
		case CreateDoiFailureError:
			res.status(400).json({ error: error.message });
			break;
	}
	next(error);
});

app.listen(process.env.PORT, () => {
	console.log(`server is running on port ${process.env.PORT}`);
});
