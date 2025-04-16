import fs from "fs/promises";

import { beforeAll, describe, expect, it } from "vitest";

import { mockServerCode } from "~/lib/__tests__/utils";
import { env } from "../env/env";

const { createForEachMockedTransaction } = await mockServerCode();

const { getTrx } = createForEachMockedTransaction();

beforeAll(async () => {
	// check if minio is up

	if (!env.ASSETS_STORAGE_ENDPOINT) {
		throw new Error(
			"You should only run this test against a local minio instance, not to prod S3"
		);
	}

	const check = await fetch(env.ASSETS_STORAGE_ENDPOINT, {
		method: "OPTIONS",
	});

	if (!check.ok) {
		throw new Error(
			"Minio is not running. Please setup the test environment properly by running `pnpm -w test:setup`"
		);
	}
});

describe("assets upload", () => {
	it("should be able to upload a file to the minio bucket from the server", async () => {
		const { uploadFileToS3 } = await import("./assets");

		const file = await fs.readFile(
			new URL("../__tests__/fixtures/big-croc.jpg", import.meta.url)
		);

		const url = await uploadFileToS3("test", "test.ts", file, {
			contentType: "text/plain",
		});

		expect(url).toBeDefined();

		const text = await fetch(url).then((res) => res.text());

		expect(text).toEqual(file.toString("utf8"));
	});
});
