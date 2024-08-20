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
