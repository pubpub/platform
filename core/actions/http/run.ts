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
			field_id: eb.selectFrom("field").select("field.id"),
			pub_id: pubId as PubsId,
			value: JSON.stringify(value),
		}))
		.execute();
};

export const run = defineRun<typeof action>(async ({ pub, config, runParameters }) => {
	const { url, method, authToken, body } = {
		url: runParameters?.url ?? config.url,
		method: runParameters?.method ?? config.method,
		authToken: runParameters?.authToken ?? config.authToken,
		body: runParameters?.body ?? config.body,
	};

	const res = await fetch(url, {
		method: method,
		headers: {
			...(authToken && { Authorization: `Bearer ${authToken}` }),
			"Content-Type": "application/json",
		},
		body: body && method !== "GET" ? JSON.stringify(body) : undefined,
	});

	if (res.status !== 200) {
		return {
			title: "Error",
			error: `Error ${res.status} ${res.statusText}`,
		};
	}

	if (
		runParameters?.outputMap &&
		!res.headers.get("content-type")?.includes("application/json")
	) {
		return {
			title: "Error",
			error: `Expected application/json response, got ${res.headers.get("content-type")}`,
		};
	}

	const result = await res.json();

	const setRunParameters = runParameters?.outputMap
		? Object.entries(runParameters.outputMap).filter((entry): entry is [string, string] =>
				Boolean(entry[1])
			)
		: [];

	if (setRunParameters.length > 0) {
		logger.info({ msg: "setRunParameters", setRunParameters });

		if (runParameters?.test) {
			return {
				success: true,
				report: `<div>
			<p>HTTP request ran successfully</p>
			<p>The resulting mapping would have been:</p>
			<div>
${setRunParameters.map(([fieldSlug, value]) => `<p>${fieldSlug}: ${pub.values[fieldSlug]} ➡️ ${result[value]}</p>`).join("\n")}
			</div>`,
				data: { result },
			};
		}

		const updates = await Promise.allSettled(
			setRunParameters.map(async ([fieldSlug, value]) => {
				if (value === undefined) {
					throw new Error(`Field ${fieldSlug} was not provided in the output map`);
				}
				const resValue = result[value];
				if (resValue === undefined) {
					throw new Error(`Field ${value} not found in response`);
				}
				await updateField({ pubId: pub.id, fieldSlug, value: resValue });
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
			report: `<div>
			<p>Successfully updated fields</p>
			<div>
${setRunParameters.map(([fieldSlug, value]) => `<p>${fieldSlug}: ${pub.values[fieldSlug]} ➡️ ${result[value]}</p>`).join("\n")}
			</div>`,
			data: { result },
		};
	}

	logger.info({ msg: "ran http", pub, config, runParameters });

	return {
		success: true,
		report: "The pub was successfully pushed to v6",
		data: {},
	};
});
