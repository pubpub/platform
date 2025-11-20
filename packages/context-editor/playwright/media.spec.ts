import type { Page } from "@playwright/test"

import { expect, test } from "@playwright/test"

import { EDITOR_WITH_IMAGE_STORY } from "./constants"
import { getProsemirrorState } from "./utils"

const clickImageNode = async (page: Page) => {
	await page.getByRole("button", { name: "image", exact: true }).click()
}

test.describe("images", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto(EDITOR_WITH_IMAGE_STORY)
		// const editor = page.locator(".ProseMirror");
		// await editor.click();
	})

	test("can set image attributes", async ({ page }) => {
		await clickImageNode(page)
		await page.getByTestId("attribute-panel").waitFor()
		const expected = {
			src: "http://localhost:6006/image1.jpg",
			linkTo: "https://knowledgefutures.org",
			alt: "example image",
			id: "image-id",
			class: "image-class",
			width: 50,
			align: "right",
			fullResolution: true,
		}

		await page.getByRole("textbox", { name: "Source" }).fill(expected.src)
		await page.getByRole("textbox", { name: "Alt text" }).fill(expected.alt)
		await page.getByRole("textbox", { name: "Link to" }).fill(expected.linkTo)
		// Advanced options
		await page.getByTestId("advanced-options-trigger").click()
		await page.getByRole("textbox", { name: "id" }).fill(expected.id)
		await page.getByRole("textbox", { name: "class" }).fill(expected.class)
		// Style
		await page.getByRole("tab", { name: "Style" }).click()
		await page.getByRole("spinbutton").fill(`${expected.width}`)
		await page.getByRole("radio", { name: expected.align }).click()
		await page.getByRole("switch", { name: "Always use full resolution" }).click()
		const state = await getProsemirrorState(page)
		expect(state.content[1].content[0].attrs).toMatchObject(expected)
	})

	test("can add and remove caption, credit, license fields", async ({ page }) => {
		// await clickImageNode(page);
		await page.getByRole("button", { name: "figure", exact: true }).first().click()
		await page.getByTestId("attribute-panel").waitFor()
		await expect(page.getByRole("button", { name: "figcaption" })).toHaveCount(0)
		const figureParts = [
			{ label: "Caption", name: "figcaption" },
			{ label: "Credit", name: "credit" },
			{ label: "License", name: "license" },
		]
		// Toggle on and off
		for (const { label, name } of figureParts) {
			await page.getByRole("switch", { name: label }).click()
			await page.getByRole("button", { name }).waitFor()
			await page.getByRole("switch", { name: label }).click()
			await page.getByRole("button", { name }).waitFor({ state: "hidden" })
		}
		// Toggle everyone on
		for (const { label, name } of figureParts) {
			await page.getByRole("switch", { name: label }).click()
			await page.getByRole("button", { name }).waitFor()
		}

		// Fill in values and check they reflect in the prosemirror state
		const caption = "my caption"
		await page.locator("figure figcaption").click()
		await page.waitForTimeout(100)
		await page.keyboard.type(caption)

		const credit = "my credit"
		await page.locator("figure").getByRole("paragraph").first().click()
		await page.waitForTimeout(100)
		await page.keyboard.type(credit)

		const license = "my license"
		await page.locator("figure").getByRole("paragraph").nth(1).click()
		await page.waitForTimeout(100)
		await page.keyboard.type(license)

		const state = await getProsemirrorState(page)
		const captionNode = state.content[1].content[1]
		expect(captionNode).toMatchObject({
			type: "figcaption",
			content: [{ type: "text", text: caption }],
		})
		const creditNode = state.content[1].content[2]
		expect(creditNode).toMatchObject({
			type: "credit",
			content: [{ type: "text", text: credit }],
		})
		const licenseNode = state.content[1].content[3]
		expect(licenseNode).toMatchObject({
			type: "license",
			content: [{ type: "text", text: license }],
		})
	})
})
