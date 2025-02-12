import type { Page } from "@playwright/test";

import { expect, test } from "@playwright/test";

import { FieldsPage } from "./fixtures/fields-page";
import { FormsEditPage } from "./fixtures/forms-edit-page";
import { FormsPage } from "./fixtures/forms-page";
import { LoginPage } from "./fixtures/login-page";
import { PubDetailsPage } from "./fixtures/pub-details-page";
import { PubTypesPage } from "./fixtures/pub-types-page";
import { PubsPage } from "./fixtures/pubs-page";
import { createCommunity } from "./helpers";

const now = new Date().getTime();
const COMMUNITY_SLUG = `playwright-test-community-${now}`;
const FORM_SLUG = `playwright-test-form-${now}`;

test.describe.configure({ mode: "serial" });

let page: Page;

test.beforeAll(async ({ browser }) => {
	page = await browser.newPage();

	const loginPage = new LoginPage(page);
	await loginPage.goto();
	await loginPage.loginAndWaitForNavigation();

	await createCommunity({
		page,
		community: { name: `test community ${now}`, slug: COMMUNITY_SLUG },
	});

	/**
	 * Fill out everything required to make an external form:
	 * 1. Fields
	 * 2. Form with fields
	 * 3. A pub
	 */
	// Populate the fields page with options
	const fieldsPage = new FieldsPage(page, COMMUNITY_SLUG);
	await fieldsPage.goto();
	await fieldsPage.addFieldsOfEachType();

	const pubTypePage = new PubTypesPage(page, COMMUNITY_SLUG);
	await pubTypePage.goto();
	await pubTypePage.addType("File Upload Test", "", ["title", "fileupload"]);
});

test.afterAll(async () => {
	await page.close();
});

test.describe("File upload", () => {
	test("should upload a file", async ({ context }) => {
		const pubsPage = new PubsPage(page, COMMUNITY_SLUG);
		await pubsPage.goTo();
		const pubId = await pubsPage.createPub({
			pubType: "File Upload Test",
			values: { title: "The Activity of Slugs" },
		});

		const pubEditUrl = `/c/${COMMUNITY_SLUG}/pubs/${pubId}/edit`;
		await page.goto(pubEditUrl);

		await page.setInputFiles("input[type='file']", [
			new URL("fixtures/test-assets/test-diagram.png", import.meta.url).pathname,
		]);
		// const fileUploadElement = await page
		// 	.getByRole("button", { name: "browse files", exact: true })
		// 	.click({
		// 		timeout: 2_000,
		// 	});

		// const fileChooser = await page.waitForEvent("filechooser", (fileChooser) => {
		// 	return !!fileChooser;
		// });
		// await fileChooser.setFiles(
		// 	new URL("fixtures/test-assets/test-diagram.png", import.meta.url).pathname
		// );

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
		await page.waitForURL(`/c/${COMMUNITY_SLUG}/pubs/${pubId}`);

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
