import * as sdk from "@pubpub/integration-sdk"
import { Eta } from "eta"
import express from "express"
import { ok as assert } from "node:assert"
import process from "node:process"
import {
	makeInstanceConfig,
	findInstanceConfig,
	updateInstanceConfig,
	getAllInstanceIds,
} from "./config"
import { makeWordCountPatch } from "./counts"
import manifest from "./pubpub-manifest.json"

const app = express()
const eta = new Eta({ views: "views" })
const client = sdk.makeClient(manifest)

app.use(express.json())
app.use(
	"/pubpub-manifest.json",
	express.static(process.cwd() + "/pubpub-manifest.json")
)

/*
 * Integration Routes
 */

// PubPub opens a window to `GET /configure` when a user creates a new
// integration instance from the PubPub dashboard. This route provides the
// means to configure the new instance.
//
// PubPub makes no assumptions about how the instance is configured. This
// template uses Redis to store the configuration, but you can use a database
// or any other form of persistent storage.
//
// `GET /configure` receives a sole query parameter, `instanceId`: a unique
// identifier for the instance that can be used to read and write instance
// configuration.
app.get("/configure", async (req, res, next) => {
	try {
		const { instanceId } = req.query
		// Validate the instanceId query parameter
		assert(typeof instanceId === "string")
		// Find an existing instance configuration or create a new one
		const instanceConfig =
			(await findInstanceConfig(instanceId)) ?? makeInstanceConfig()
		// Render the configuration form
		res.send(
			eta.render("configure", {
				title: "Configure Word Counts",
				instanceConfig,
				instanceId,
			})
		)
	} catch (error) {
		next(error)
	}
})

// PubPub opens a window to `GET /apply` when a user manually activates an
// integration instance for a single Pub. This route provides the means to
// manually update Pub metadata using an integration instance's configuration.
//
// In this template, the page rendered by `GET /apply` is a form with a single
// button that, when clicked, makes a request to `POST /apply` to update the
// Pub.
//
// `GET /apply` receives two query parameters, `instanceId` and `pubId`, which
// can be used to read the instance configuration and read/write Pub metadata,
// respectively.
app.get("/apply", async (req, res, next) => {
	try {
		const { instanceId, pubId } = req.query
		// Validate the instanceId and pubId query parameters
		assert(typeof instanceId === "string")
		assert(typeof pubId === "string")
		// Find the instance configuration.
		const instanceConfig = await findInstanceConfig(instanceId)
		// Render the Pub processing form.
		if (instanceConfig) {
			res.send(
				eta.render("apply", {
					title: "Update Word Counts",
					instanceId,
					instanceConfig,
					pubId,
				})
			)
		} else {
			// Respond with a 400 if the integration instance is not configured.
			throw new sdk.ResponseError(400, "Instance not configured")
		}
	} catch (error) {
		next(error)
	}
})

// PubPub makes a request to `POST /apply` when an instance is automatically
// triggered, e.g. by a workflow stage rule.
//
// In this example, `POST /apply` is also used by the form rendered by
// `GET /apply` to manually process a Pub.
//
// `POST /apply` receives two query parameters, `instanceId` and `pubId`, which
// are used to read the instance configuration and read/write Pub metadata,
// respectively.
app.post("/apply", async (req, res, next) => {
	try {
		const { instanceId, pubId } = req.query
		// Validate the instanceId and pubId query parameters
		assert(typeof instanceId === "string")
		assert(typeof pubId === "string")
		// Find the instance configuration.
		const instanceConfig = await findInstanceConfig(instanceId)
		// Update the Pub metadata.
		if (instanceConfig) {
			const patch = makeWordCountPatch(instanceConfig)
			await client.put(instanceId, pubId, patch)
			res.json(patch)
		} else {
			// Respond with a 400 if the integration instance is not configured.
			throw new sdk.ResponseError(400, "Instance not configured")
		}
	} catch (error) {
		next(error)
	}
})

/*
 * Internal Routes
 */

// `PUT /configure` is called by the configuration form rendered by
// `GET /configure` to save the instance configuration.
//
// This is a local API route and not part of the PubPub integration interface.
app.put("/configure", async (req, res, next) => {
	try {
		const { instanceId } = req.query
		const instanceConfig = req.body
		assert(typeof instanceId === "string")
		await updateInstanceConfig(instanceId, instanceConfig)
		res.send(instanceConfig)
	} catch (error) {
		next(error)
	}
})

// `GET /debug` is a route used for diagnostic purposes that returns a list of
// all active instance IDs.
app.get("/debug", async (_, res, next) => {
	try {
		const instanceIds = await getAllInstanceIds()
		res.send(eta.render("debug", { title: "debug", instanceIds }))
	} catch (error) {
		next(error)
	}
})

// Error handling middleware
app.use((error: any, _: any, res: any, next: any) => {
	const { cause: errorCause, constructor: errorType } = error
	switch (errorType) {
		case sdk.ResponseError:
			res.status(error.cause.status).json(error)
			return
		case sdk.PubPubError:
			// Use 502 for all PubPub errors
			res
				.status(errorCause instanceof sdk.ResponseError ? 502 : 500)
				.json(error)
			return
	}
	res
		.status(500)
		.json(new sdk.IntegrationError("Internal Server Error", { cause: error }))
})

app.listen(process.env.PORT, () => {
	console.log(`Word counts integration is up (port=${process.env.PORT})`)
})
