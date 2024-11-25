import type { Page } from "@playwright/test";

import { LoginPage } from "./fixtures/login-page";

export const login = async (page: Page, email = "all@pubpub.org", password = "pubpub-all") => {
	const loginPage = new LoginPage(page);
	await loginPage.goto();
	await loginPage.loginAndWaitForNavigation(email, password);
};
