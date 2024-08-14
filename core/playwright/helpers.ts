import type { Page } from "@playwright/test";

export const login = async ({ page }: { page: Page }) => {
	await page.goto("/login");
	await page.getByLabel("email").fill("all@pubpub.org");
	await page.getByRole("textbox", { name: "password" }).fill("pubpub-all");
	await page.getByRole("button", { name: "Sign in" }).click();
	await page.waitForURL(/\/c\/\w+\/stages/);
};

export const createCommunity = async ({
	page,
	community: communityProps,
}: {
	page: Page;
	community?: Partial<{ name: string; slug: string }>;
}) => {
	const defaultCommunity = { name: "test community", slug: "test-community-slug" };
	const community = communityProps
		? { ...defaultCommunity, ...communityProps }
		: defaultCommunity;

	await page.goto("/communities");
	await page.getByRole("button", { name: "Create Community" }).click();
	await page.locator("input[name='name']").fill(community.name);
	await page.locator("input[name='slug']").fill(community.slug);
	await page.getByRole("dialog").getByRole("button", { name: "Create Community" }).click();

	return community;
};
