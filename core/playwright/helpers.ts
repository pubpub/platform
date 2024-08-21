import type { Page } from "@playwright/test";

import { CommunityPage } from "./fixtures/community-page";

export const login = async ({ page }: { page: Page }) => {
	await page.goto("/login");
	await page.getByLabel("email").fill("all@pubpub.org");
	await page.getByRole("textbox", { name: "password" }).fill("pubpub-all");
	await page.getByRole("button", { name: "Sign in" }).click();
	await page.waitForURL(/\/c\/\w+\/stages/);
};

export const createCommunity = async ({
	page,
	community,
}: {
	page: Page;
	community?: Partial<{ name: string; slug: string }>;
}) => {
	const communityPage = new CommunityPage(page);
	await communityPage.goto();
	await communityPage.addCommunity(
		community?.name ?? "test community",
		community?.slug ?? "test-community-slug"
	);
};

export const gotoInbucket = async ({ page }: { page: Page }) => {
	await page.goto("http://localhost:54324/monitor");
};

const waitForJustNow = async (page: Page, retryCount = 0) => {
	const date = await page
		.locator("body > div > div.page > div > aside.message-list > div:nth-child(1) > div.date")
		.first();
	const text = await date.innerText();

	if (text !== "just now") {
		if (retryCount > 5) {
			throw new Error("Timed out waiting for just now");
		}
		await page.waitForTimeout(1000);
		await page.reload();
		await waitForJustNow(page, retryCount + 1);
	}
};

export const gotoLatestEmailForInbox = async ({ page, inbox }: { page: Page; inbox: string }) => {
	await page.goto("http://localhost:54324/monitor");
	await page.reload();
	await page.getByPlaceholder("mailbox").click();
	await page.getByPlaceholder("mailbox").fill(inbox);
	await page.getByPlaceholder("mailbox").press("Enter");

	await waitForJustNow(page);
	await page.click(
		"body > div > div.page > div > aside.message-list > div:nth-child(1) > div.date"
	);

	const textElement = page.locator(
		"body > div > div.page > div > main > div > div.tab-panel > article > rendered-html"
	);

	return textElement;
};
