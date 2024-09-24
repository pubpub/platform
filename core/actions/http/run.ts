"use server";

import { JSONPath } from "jsonpath-plus";

import type { PubsId } from "db/public";
import { logger } from "logger";

import type { action } from "./action";
import { _updatePub } from "~/app/components/PubCRUD/actions";
import { defineRun } from "../types";

const findNestedStructure = (json: unknown, path: string) => {
	if (typeof json !== "object") {
		// TODO: handle this
		return;
	}
	const result = JSONPath({ path, json });
	return result;
};

export const run = defineRun<typeof action>(
	async ({ pub, config, configFieldOverrides, args, argsFieldOverrides }) => {
		const { url, method, authToken } = {
			url: args?.url ?? config.url,
			method: args?.method ?? config.method,
			authToken: args?.authToken ?? config.authToken,
		};

		const finalOutputMap = args?.outputMap ?? config?.outputMap ?? [];

		let body: string | undefined;

		if (args.body) {
			body = argsFieldOverrides.has("body") ? JSON.stringify(args.body) : args.body;
		} else if (config.body) {
			body = configFieldOverrides.has("body") ? JSON.stringify(config.body) : config.body;
		}

		const res = await fetch(url, {
			method: method,
			headers: {
				...(authToken && { Authorization: `Bearer ${authToken}` }),
				"Content-Type": "application/json",
			},
			body,
			cache: "no-store",
		});

		if (res.status !== 200) {
			return {
				title: "Error",
				error: `Error ${res.status} ${res.statusText}`,
			};
		}

		if (
			finalOutputMap.length > 0 &&
			!res.headers.get("content-type")?.includes("application/json")
		) {
			return {
				title: "Error",
				error: `Expected application/json response, got ${res.headers.get("content-type")}`,
			};
		}

		const result = await res.json();

		if (!finalOutputMap || finalOutputMap.length === 0) {
			return {
				success: true,
				report: `<p>The HTTP request ran successfully without mapping</p>
  <pre> 
		${JSON.stringify(result, null, 2)}
  </pre>`,
				data: {},
			};
		}

		const mappedOutputs = finalOutputMap.map(({ pubField, responseField }) => {
			if (responseField === undefined) {
				throw new Error(`Field ${pubField} was not provided in the output map`);
			}
			const resValue = findNestedStructure(result, responseField);
			if (resValue === undefined || (Array.isArray(resValue) && resValue.length === 0)) {
				throw new Error(
					`Field "${responseField}" not found in response. Response was ${JSON.stringify(result)}`
				);
			}
			return { pubField, resValue };
		});

		if (args?.test) {
			return {
				success: true,
				report: `<div>
			<p>HTTP request ran successfully</p>
			<p>The resulting mapping would have been:</p>
			<div>
${mappedOutputs.map(({ pubField, resValue }) => `<p>${pubField}: ${pub.values[pubField]} ➡️ ${resValue}</p>`).join("\n")}
<span>Data</span>
				<p>${JSON.stringify(result, null, 2)}</p>
			</div>`,
				data: { result },
			};
		}

		const fields = mappedOutputs.map(({ pubField, resValue }) => ({
			slug: pubField,
			value: resValue,
		}));

		const updateResult = await _updatePub({
			pubId: pub.id as PubsId,
			fields,
		});

		if (updateResult.error) {
			logger.debug(updateResult.error);
			return {
				title: "Error",
				error: `Failed to update fields: ${updateResult.error}`,
				cause: updateResult.error,
			};
		}

		return {
			success: true,
			report: `<p>Successfully updated fields</p>
			<div>
${mappedOutputs.map(({ pubField, resValue }) => `<p>${pubField}: ${pub.values[pubField]} ➡️ ${resValue}</p>`).join("\n")}`,
			data: { result },
		};
	}
);
