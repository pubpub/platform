import type { Locator, Page } from "@playwright/test";
import type { z } from "zod";

import { expect } from "@playwright/test";

import { ApiAccessScope, ApiAccessType } from "db/public";

import type { createTokenFormSchema } from "~/app/c/[communitySlug]/settings/tokens/types";

type Permissions = z.infer<typeof createTokenFormSchema>["permissions"];

export class ApiTokenPage {
	private readonly communitySlug: string;

	private readonly newTokenButton: Locator;

	constructor(
		public readonly page: Page,
		communitySlug: string
	) {
		this.communitySlug = communitySlug;
		this.newTokenButton = this.page.getByTestId("new-token-button").first();
	}

	async goto() {
		await this.page.goto(`/c/${this.communitySlug}/settings/tokens`);
	}

	async togglePermission(scope: ApiAccessScope, type: ApiAccessType) {
		await this.page.getByTestId(`${scope}-${type}-checkbox`).click();
	}

	async createToken(
		input: Omit<
			z.infer<typeof createTokenFormSchema>,
			"permissions" | "issuedById" | "expiration"
		> & {
			permissions: Partial<Permissions> | true;
		}
	) {
		await this.newTokenButton.click();
		await this.page.getByRole("textbox", { name: "name" }).fill(input.name);
		await this.page.getByRole("textbox", { name: "description" }).fill(input.description ?? "");
		// TODO: add this back once we have a way of using the date picker programmatically
		// await this.newTokenExpiryDatePicker.fill(input.expiration.toISOString());

		for (const scope of Object.values(ApiAccessScope)) {
			for (const type of Object.values(ApiAccessType)) {
				const value = input.permissions === true ? true : input.permissions[scope]?.[type];

				if (typeof value === "boolean") {
					if (!value) {
						continue;
					}
					await this.togglePermission(scope as ApiAccessScope, type as ApiAccessType);
					continue;
				}

				if (typeof value === "object") {
					await this.page.getByTestId(`${scope}-${type}-options`).click();

					const constraints = Object.entries(value);
					for (let i = 0; i < constraints.length; i++) {
						const [key, values] = constraints[i];
						await this.page.getByTestId(`${scope}-${type}-${key}-select`).click({
							timeout: 2_000,
						});

						const options = await this.page
							.getByLabel("Suggestions")
							.getByTestId(/^multi-select-option-/)
							.all();

						for (const option of options) {
							const optionValue = await option.getAttribute("data-testid", {
								timeout: 2_000,
							});
							const value = optionValue?.replace("multi-select-option-", "");
							if (value && !values.some((v) => v === value)) {
								await option.click({
									timeout: 2_000,
								});
							}
						}
						await this.page.getByTestId(`multi-select-close`).click();

						// wait for the popover to close if we have multiple constraints so the selectors do not overlap
						if (constraints.length > 1 && i < constraints.length - 1) {
							await this.page.waitForTimeout(1_000);
						}
						continue;
					}
				}
			}
		}

		await this.page.getByRole("textbox", { name: "name" }).fill(input.name);

		await this.page.getByTestId("create-token-button").click({
			timeout: 1_000,
		});

		const token = await this.page.getByTestId("token-value").textContent();

		// close modal
		await this.page.keyboard.press("Escape");
		return token;
	}

	// TODO: delete token
	// see site.spec for implementation

	// TODO: get token permissions
	// see site.spec for implementation
}

export function expectStatus<T extends { status: number }, S extends T["status"]>(
	response: T,
	status: S
): asserts response is Extract<T, { status: S }> {
	expect(response.status).toBe(status);
}
