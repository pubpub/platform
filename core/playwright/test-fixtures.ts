import { test as base } from "@playwright/test"

import { MockPreprintRepo } from "./fixtures/mock-preprint-repo"

export type TestFixtures = {
	mockPreprintRepo: MockPreprintRepo
}

export const test = base.extend<TestFixtures>({
	// biome-ignore lint/correctness/noEmptyPattern: shh
	mockPreprintRepo: async ({}, use) => {
		const repo = new MockPreprintRepo()
		await repo.start()
		await use(repo)
		await repo.stop()
	},
})

export { expect } from "@playwright/test"
