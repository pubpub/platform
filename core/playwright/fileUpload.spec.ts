import type { Page } from "@playwright/test";

import { expect, test } from "@playwright/test";

import { CoreSchemaType, MemberRole } from "db/public";

import type { CommunitySeedOutput } from "~/prisma/seed/createSeed";
import { createSeed } from "~/prisma/seed/createSeed";
import { seedCommunity } from "~/prisma/seed/seedCommunity";
import { FieldsPage } from "./fixtures/fields-page";
import { LoginPage } from "./fixtures/login-page";
import { PubTypesPage } from "./fixtures/pub-types-page";
import { PubsPage } from "./fixtures/pubs-page";
import { createCommunity } from "./helpers";

test.describe.configure({ mode: "serial" });

let page: Page;

const seed = createSeed({
	community: { name: `test community`, slug: `test-community-slug` },
	pubFields: {
		Title: { schemaName: CoreSchemaType.String },
		Content: { schemaName: CoreSchemaType.String },
		FileUpload: { schemaName: CoreSchemaType.FileUpload },
	},
	pubTypes: {
		"File Upload Test": {
			Title: { isTitle: true },
			Content: { isTitle: false },
			FileUpload: { isTitle: false },
		},
	},
	users: {
		admin: {
			password: "password",
			role: MemberRole.admin,
		},
	},
});

let community: CommunitySeedOutput<typeof seed>;
test.beforeAll(async ({ browser }) => {
	community = await seedCommunity(seed);
	page = await browser.newPage();

	const loginPage = new LoginPage(page);
	await loginPage.goto();
	await loginPage.loginAndWaitForNavigation(community.users.admin.email, "password");
});

test.afterAll(async () => {
	await page.close();
});

test.describe("File upload", () => {
	test("should upload a file", async ({ context }) => {
		const pubsPage = new PubsPage(page, community.community.slug);
		await pubsPage.goTo();
		const pubId = await pubsPage.createPub({
			pubType: "File Upload Test",
			values: { title: "The Activity of Slugs" },
		});

		const pubEditUrl = `/c/${community.community.slug}/pubs/${pubId}/edit`;
		await page.goto(pubEditUrl);

		await page.setInputFiles("input[type='file']", [
			new URL("fixtures/test-assets/test-diagram.png", import.meta.url).pathname,
		]);

		await page.getByRole("button", { name: "Upload 1 file", exact: true }).click({
			timeout: 2_000,
		});

		await page.getByText("Complete", { exact: true }).waitFor({
			timeout: 10_000,
		});

		await page.getByRole("button", { name: "Save" }).click();
		await page.getByText("Pub successfully updated", { exact: true }).waitFor({
			timeout: 2_000,
		});

		await page.getByRole("link", { name: "View Pub", exact: true }).click();
		await page.waitForURL(`/c/${community.community.slug}/pubs/${pubId}*`);

		const fileUploadValue = await page
			.getByTestId(`FileUpload-value`)
			.getByRole("button")
			.click({
				timeout: 1_000,
			});

		const describeThing = await page.getByText("Its MIME type is").first().textContent({
			timeout: 2_000,
		});

		/**
		 * So we know the actual file is being uploaded
		 */
		const parsedDescription = describeThing?.match(
			/The file is (\d+) bytes in size. Its MIME type is (\w+\/\w+)./
		);
		expect(parsedDescription).not.toBeNull();

		const fileSize = parsedDescription?.[1];
		const mimeType = parsedDescription?.[2];

		expect(fileSize).toBeDefined();
		expect(parseInt(fileSize!)).toBe(108_839);
		expect(mimeType).toBe("image/png");

		const link = page.getByRole("link", { name: "Open file in new tab" });

		const url = await link.getAttribute("href", { timeout: 1_000 });

		expect(url).toBeDefined();
		await page.goto(url!);

		await page.waitForURL(/localhost:9000/);
	});
});
