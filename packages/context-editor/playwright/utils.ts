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
