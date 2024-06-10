"use server";

import { unstable_cache } from "next/cache";
import { defaultMarkdownParser } from "prosemirror-markdown";

import { logger } from "logger";

import type { action } from "./action";
import type { PubsId } from "~/kysely/types/public/Pubs";
import { db } from "~/kysely/database";
import { defineRun } from "../types";

const updateField = async ({
	pubId,
	fieldSlug,
	value,
}: {
	pubId: string;
	fieldSlug: string;
	value: string;
}) => {
	await db
		.with("field", (db) =>
			db.selectFrom("pub_fields").select("id").where("slug", "=", fieldSlug)
		)
		.insertInto("pub_values")
		.values((eb) => ({
			fieldId: eb.selectFrom("field").select("field.id"),
			pubId: pubId as PubsId,
			value: JSON.stringify(value),
		}))
		.execute();
};

export const run = defineRun<typeof action>(async ({ pub, config, args }) => {
	const { url, method, authToken, body } = {
		url: args?.url ?? config.url,
		method: args?.method ?? config.method,
		authToken: args?.authToken ?? config.authToken,
		body: args?.body ?? config.body,
	};

	const finalOutputMap = args?.outputMap ?? config?.outputMap ?? [];

	const res = await fetch(url, {
		method: method,
		headers: {
			...(authToken && { Authorization: `Bearer ${authToken}` }),
			"Content-Type": "application/json",
		},
		body: body && method !== "GET" ? body : undefined,
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

	if (finalOutputMap.length > 0) {
		if (args?.test) {
			return {
				success: true,
				report: `<div>
			<p>HTTP request ran successfully</p>
			<p>The resulting mapping would have been:</p>
			<div>
${finalOutputMap.map(({ pubField, responseField }) => `<p>${pubField}: ${pub.values[pubField]} ➡️ ${result[responseField]}</p>`).join("\n")}
			</div>`,
				data: { result },
			};
		}

		const updates = await Promise.allSettled(
			finalOutputMap.map(async ({ pubField, responseField }) => {
				if (responseField === undefined) {
					throw new Error(`Field ${pubField} was not provided in the output map`);
				}
				const resValue = result[responseField];
				if (resValue === undefined) {
					throw new Error(`Field ${responseField} not found in response`);
				}
				await updateField({ pubId: pub.id, fieldSlug: pubField, value: resValue });
			})
		);

		const results = updates
			.map((update) => {
				if (update.status === "rejected") {
					return update.reason;
				}
				return true;
			})
			.filter((result) => result !== true);

		if (results.length > 0) {
			return {
				title: "Error",
				error: `Failed to update fields: ${results.join(", ")}`,
				cause: results,
			};
		}

		return {
			success: true,
			report: `<p>Successfully updated fields</p>
			<div>
${finalOutputMap.map(({ pubField, responseField }) => `<p>${pubField}: ${pub.values[pubField]} ➡️ ${result[responseField]}</p>`).join("\n")}`,
			data: { result },
		};
	}

	logger.info({ msg: "ran http", pub, config, args });

	return {
		success: true,
		report: `<p>The HTTP request ran successfully</p>
  <pre> 
		${JSON.stringify(result, null, 2)}
  </pre>`,
		data: {},
	};
});
