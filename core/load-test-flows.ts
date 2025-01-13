/* eslint-disable no-restricted-properties */

import type { Page } from "@playwright/test"

import * as loginFlows from "./playwright/login.flows"

export async function loginFlow(page: Page) {
	await loginFlows.login(
		page,
		process.env.LOAD_TEST_USER_EMAIL,
		process.env.LOAD_TEST_USER_PASSWORD
	)
}
