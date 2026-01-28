"use server"

import type { PubsId } from "db/public"
import type { PubValues } from "~/lib/server"
import type { action } from "./action"

import { JSONPath } from "jsonpath-plus"

import { logger } from "logger"

import { updatePub } from "~/lib/server/pub"
import { defineRun } from "../types"

const findNestedStructure = (json: unknown, path: string) => {
	if (typeof json !== "object") {
		// TODO: handle this
		return
	}
	const result = JSONPath({ path, json, wrap: false })
	return result
}

export const run = defineRun<typeof action>(async ({ pub, config, lastModifiedBy }) => {
	const { url, method, authToken } = config

	const finalOutputMap = config?.outputMap ?? []

	const body = typeof config.body === "string" ? config.body : JSON.stringify(config.body)

	const res = await fetch(url, {
		method: method,
		headers: {
			...(authToken && { Authorization: `Bearer ${authToken}` }),
			"Content-Type": "application/json",
		},
		body,
		cache: "no-store",
	})

	if (!res.ok) {
		return {
			success: false,
			title: "Error",
			error: `Error ${res.status} ${res.statusText}`,
		}
	}

	if (
		finalOutputMap.length > 0 &&
		!res.headers.get("content-type")?.includes("application/json")
	) {
		return {
			success: false,
			title: "Error",
			error: `Expected application/json response, got ${res.headers.get("content-type")}`,
		}
	}

	const result = await res.json()

	if (!finalOutputMap || finalOutputMap.length === 0 || !pub) {
		return {
			success: true,
			report: (
				<div>
					<p>The HTTP request ran successfully without mapping</p>
					<pre>{JSON.stringify(result, null, 2)}</pre>
				</div>
			),
			data: {},
		}
	}

	const mappedOutputs = finalOutputMap.map(({ pubField, responseField }) => {
		if (responseField === undefined) {
			throw new Error(`Field ${pubField} was not provided in the output map`)
		}
		const resValue = findNestedStructure(result, responseField)
		if (resValue === undefined || (Array.isArray(resValue) && resValue.length === 0)) {
			throw new Error(
				`Field "${responseField}" not found in response. Response was ${JSON.stringify(result)}`
			)
		}
		return { pubField, resValue }
	})

	const pubValues = mappedOutputs.reduce((acc, { pubField, resValue }) => {
		acc[pubField] = resValue
		return acc
	}, {} as PubValues)

	try {
		await updatePub({
			pubId: pub.id as PubsId,
			communityId: pub.communityId,
			pubValues,
			continueOnValidationError: false,
			lastModifiedBy,
		})
	} catch (error) {
		logger.debug(error)
		return {
			success: false,
			title: "Error",
			error: `Failed to update fields: ${error}`,
			cause: error,
		}
	}

	return {
		success: true,
		report: (
			<div>
				<p>Successfully updated fields</p>
				<div>
					$
					{mappedOutputs
						.map(
							({ pubField, resValue }) =>
								`<p>${pubField}: ${pub.values.find((value) => value.fieldSlug === pubField)?.value} ➡️ ${resValue}</p>`
						)
						.join("\n")}
				</div>
			</div>
		),
		data: { result },
	}
})
