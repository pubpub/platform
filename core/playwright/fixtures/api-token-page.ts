import type { Locator, Page } from "@playwright/test";
import type { z } from "zod";

import { expect } from "@playwright/test";

import { ApiAccessScope, ApiAccessType } from "db/public";

import type { createTokenFormSchema } from "~/app/c/[communitySlug]/settings/tokens/CreateTokenForm";

export class ApiTokenPage {
	private readonly newTokenNameBox: Locator;
	private readonly newTokenDescriptionBox: Locator;
	// private readonly newTokenExpiryDatePicker: Locator;
	private readonly newTokenCreateButton: Locator;
	private readonly communitySlug: string;

	constructor(
		public readonly page: Page,
		communitySlug: string
	) {
		this.communitySlug = communitySlug;
		this.newTokenNameBox = this.page.getByRole("textbox", { name: "name" });
		this.newTokenDescriptionBox = this.page.getByRole("textbox", { name: "description" });
		// this.newTokenExpiryDatePicker = this.page.getByLabel("Expiry date");
		this.newTokenCreateButton = this.page.getByTestId("create-token-button");
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
			permissions: Partial<z.infer<typeof createTokenFormSchema>["permissions"]> | true;
		}
	) {
		await this.newTokenNameBox.fill(input.name);
		await this.newTokenDescriptionBox.fill(input.description ?? "");
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

				if (value && "stage" in value) {
					await this.page.getByTestId(`${scope}-${type}-options`).click();
					await this.page.getByTestId(`${scope}-${type}-stages-select`).click();
					for (const stage of value.stages) {
						await this.page.getByLabel("Suggestions").getByText(stage).click();
					}
					continue;
				}
			}
		}

		await this.newTokenCreateButton.click();

		const token = await this.page.getByTestId("token-value").textContent();

		// close modal
		await this.page.keyboard.press("Escape");
		return token;
	}

	// TODO: delete token

	// TODO: get token permissions
}

export function expectStatus<T extends { status: number }, S extends T["status"]>(
	response: T,
	status: S
): asserts response is Extract<T, { status: S }> {
	expect(response.status).toBe(status);
}
