import type { Page } from "@playwright/test";

import { expect } from "@playwright/test";

export const assertMenuItemActiveState = async ({
	page,
	name,
	isActive,
}: {
	page: Page;
	name: string;
	isActive: boolean;
}) => {
	await expect(page.getByRole("button", { name })).toHaveAttribute("aria-pressed", `${isActive}`);
};

export const getProsemirrorState = async (page: Page) => {
	const text = await page.getByTestId("prosemirror-state").textContent();
	return text ? JSON.parse(text) : null;
};
