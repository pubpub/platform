import type { Locator, Page } from "@playwright/test";
import type { z } from "zod";

import { expect } from "@playwright/test";

import { ApiAccessScope, ApiAccessType } from "db/public";

import type { createTokenFormSchema } from "~/app/c/[communitySlug]/settings/tokens/CreateTokenForm";
import type { Prettify } from "~/lib/types";

type Permissions = z.infer<typeof createTokenFormSchema>["permissions"];

// this is so we can specify the stage name rather than the stage id
// type PermissionsButWithStringsInsteadOfIds = {
// 	[Scope in keyof Permissions]?: {
// 		[Permission in keyof Permissions[Scope]]: Permissions[Scope][Permission] extends
// 			| boolean
// 			| undefined
// 			? Permissions[Scope][Permission]
// 			: Exclude<
// 						Permissions[Scope][Permission],
// 						boolean | undefined
// 				  > extends infer Restrictions
// 				?
// 						| {
// 								[Restriction in keyof Restrictions]: any[] extends Restrictions[Restriction]
// 									? string[]
// 									: Restrictions[Restriction];
// 						  }
// 						| boolean
// 						| undefined
// 				: never;
// 	};
// };

// declare const x: PermissionsButWithStringsInsteadOfIds;

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
			permissions: Partial<Permissions> | true;
		}
	) {
		await this.newTokenNameBox.click();
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

				if (typeof value === "object") {
					await this.page.getByTestId(`${scope}-${type}-options`).click();
					for (const [key, values] of Object.entries(value)) {
						await this.page.getByTestId(`${scope}-${type}-${key}-select`).click({
							timeout: 2_000,
						});
						for (const val of values) {
							await this.page
								.getByLabel("Suggestions")
								.getByTestId(`multi-select-option-${val}`)
								.click({
									timeout: 2_000,
								});
						}
						await this.page.getByTestId(`multi-select-close`).click();
						continue;
					}
				}
			}
		}

		// for some reason the name is not recognized properly sometimes
		await this.newTokenNameBox.fill(input.name);

		await this.newTokenCreateButton.click({
			timeout: 1_000,
		});

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
