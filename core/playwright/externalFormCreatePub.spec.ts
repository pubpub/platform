import type { Page } from "@playwright/test"
import type { CommunitySeedOutput } from "~/prisma/seed/createSeed"

import { faker } from "@faker-js/faker"
import { expect, test } from "@playwright/test"

import { CoreSchemaType, ElementType, InputComponent, MemberRole } from "db/public"

import { createSeed } from "~/prisma/seed/createSeed"
import { seedCommunity } from "~/prisma/seed/seedCommunity"
import { FieldsPage } from "./fixtures/fields-page"
import { FormsEditPage } from "./fixtures/forms-edit-page"
import { FormsPage } from "./fixtures/forms-page"
import { LoginPage } from "./fixtures/login-page"
import { PubsPage } from "./fixtures/pubs-page"
import { retryAction } from "./helpers"

const seed = createSeed({
	community: {
		name: `test community`,
		slug: "test-community",
	},
	pubFields: {
		Title: {
			schemaName: CoreSchemaType.String,
		},
		Content: {
			schemaName: CoreSchemaType.String,
		},
		Email: {
			schemaName: CoreSchemaType.Email,
		},
	},
	users: {
		admin: {
			role: MemberRole.admin,
			password: "password",
		},
		user2: {
			role: MemberRole.contributor,
			password: "xxxx-xxxx",
		},
		user3: {
			role: MemberRole.contributor,
			password: "xxxx-xxxx",
		},
	},
	pubTypes: {
		Submission: {
			Title: { isTitle: true },
			Content: { isTitle: false },
		},
		Evaluation: {
			Title: { isTitle: true },
			Content: { isTitle: false },
			Email: { isTitle: false },
		},
	},
	stages: {
		Evaluating: {},
	},
	pubs: [
		{
			pubType: "Submission",
			values: {
				Title: "The Activity of Snails",
			},
			stage: "Evaluating",
		},
	],
	forms: {
		Evaluation: {
			slug: "evaluation",
			pubType: "Evaluation",
			elements: [
				{
					type: ElementType.pubfield,
					field: "Title",
					component: InputComponent.textInput,
					config: {
						label: "Title",
					},
				},
				{
					type: ElementType.pubfield,
					field: "Content",
					component: InputComponent.textArea,
					config: {
						label: "Content",
					},
				},
				{
					type: ElementType.pubfield,
					field: "Email",
					component: InputComponent.textInput,
					config: {
						label: "Email",
					},
				},
			],
		},
	},
})
let community: CommunitySeedOutput<typeof seed>
let page: Page

test.beforeAll(async ({ browser }) => {
	community = await seedCommunity(seed)

	page = await browser.newPage()

	const loginPage = new LoginPage(page)
	await loginPage.goto()
	await loginPage.loginAndWaitForNavigation(community.users.admin.email, "password")
	await page.goto(
		`/c/${community.community.slug}/public/forms/${community.forms.Evaluation.slug}/fill`
	)
})

test.afterAll(async () => {
	await page.close()
})

test("Can create a pub from an external form", async () => {
	const title = "new pub"
	await expect(page.locator("h1").filter({ hasText: "Evaluation" })).toHaveCount(1)
	await page.getByTestId(`${community.community.slug}:title`).fill(title)
	await page.getByTestId(`${community.community.slug}:content`).fill("new content")
	await page.getByTestId(`${community.community.slug}:email`).fill("test@email.com")
	await page.getByRole("button", { name: "Submit" }).click()
	await expect(page.getByTestId("completed")).toHaveCount(1)

	// Check the pub page that this pub was created
	await page.goto(`/c/${community.community.slug}/pubs`)
	await expect(page.getByRole("link", { name: title, exact: true })).toHaveCount(1)
})

test.describe("Multivalue inputs", () => {
	test("Can add multivalue inputs", async () => {
		// test.setTimeout(60_000);
		const fieldsPage = new FieldsPage(page, community.community.slug)
		await fieldsPage.goto()
		// Add a numeric array and string arrays
		await fieldsPage.addField("Favorite numbers", CoreSchemaType.NumericArray)
		await fieldsPage.addField("Favorite animals", CoreSchemaType.StringArray)
		await fieldsPage.addField("Favorite fruits", CoreSchemaType.StringArray)
		// Add these to existing form
		const formEditPage = new FormsEditPage(
			page,
			community.community.slug,
			community.forms.Evaluation.slug
		)
		await formEditPage.goto()
		await formEditPage.openAddForm()

		// Radio button group with numbers
		await formEditPage.openFormElementPanel(`${community.community.slug}:favorite-numbers`)
		const numberElement = {
			name: "Favorite numbers",
			description: "Mine are odd, how about you?",
		}
		await page.getByTestId("component-radioGroup").click()
		await page.getByRole("textbox", { name: "Label" }).fill(numberElement.name)
		await page.getByRole("textbox", { name: "Description" }).fill(numberElement.description)
		const numbers = [0, 1, 2, 3]
		for (const number of numbers) {
			await page.getByLabel("Radio Values").fill(`${number}`)
			await page.keyboard.press("Enter")
			await expect(page.getByTestId(`sortable-value-${number}`)).toHaveCount(1)
		}
		await formEditPage.saveFormElementConfiguration()

		// Checkbox group with strings
		await formEditPage.openAddForm()
		await formEditPage.openFormElementPanel(`${community.community.slug}:favorite-animals`)
		const animalElement = {
			name: "Favorite animals",
			description: "Mine are furry, how about yours?",
		}
		await page.getByTestId("component-checkboxGroup").click()
		await page.getByRole("textbox", { name: "Label" }).fill(animalElement.name)
		await page.getByRole("textbox", { name: "Description" }).fill(animalElement.description)
		const animals = ["cats", "dogs", "squirrels"]
		for (const animal of animals) {
			await page.getByLabel("Checkbox Values").fill(animal)
			await page.keyboard.press("Enter")
			await expect(page.getByTestId(`sortable-value-${animal}`)).toHaveCount(1)
		}
		await page.getByTestId("include-other").click()
		await formEditPage.saveFormElementConfiguration()

		// Select dropdown with strings
		await formEditPage.openAddForm()
		await formEditPage.openFormElementPanel(`${community.community.slug}:favorite-fruits`)
		const fruitElement = {
			name: "Favorite fruits",
			description: "Make sure it isn't a vegetable",
		}
		await page
			.getByTestId("component-selectDropdown")
			.getByText("Select Dropdown", { exact: true })
			.click()

		await page.getByRole("textbox", { name: "Label" }).fill(fruitElement.name)
		await page.getByRole("textbox", { name: "Description" }).fill(fruitElement.description)
		const fruits = ["mangos", "pineapples", "figs"]
		for (const fruit of fruits) {
			await page.getByLabel("Dropdown Values").fill(fruit)
			await page.keyboard.press("Enter")
			await expect(page.getByTestId(`sortable-value-${fruit}`)).toHaveCount(1)
		}
		await formEditPage.saveFormElementConfiguration()

		// Save the form builder and go to external form
		await formEditPage.saveForm()
		await formEditPage.goToExternalForm()
		for (const element of [numberElement, animalElement, fruitElement]) {
			await expect(page.getByText(element.name)).toHaveCount(1)
			await expect(page.getByText(element.description)).toHaveCount(1)
		}

		// Fill out the form
		const title = "multivalue"
		await page.getByTestId(`${community.community.slug}:title`).fill(title)
		await page.getByTestId(`${community.community.slug}:content`).fill("content")
		await page.getByTestId(`${community.community.slug}:email`).fill("test@email.com")
		// Radio group
		await page.getByTestId("radio-0").click()
		// Checkbox group
		await page.getByTestId("checkbox-cats").click()
		await page.getByTestId("other-field").fill("otters")
		// Select dropdown
		await page.getByRole("combobox").click()
		await page.getByRole("option", { name: "mangos" }).click()
		await page.getByRole("button", { name: "Submit" }).click()
		await page.getByText("Form Successfully Submitted").waitFor()

		// Check the pub page to make sure the values we expect are there
		await page.goto(`/c/${community.community.slug}/pubs`)
		await page.getByRole("link", { name: title, exact: true }).click()
		// Make sure pub details page has loaded before making assertions
		await page.waitForURL(`/c/${community.community.slug}/pubs/*`)
		await expect(page.getByText(numberElement.name)).toHaveCount(1)
		await expect(page.getByTestId(`${numberElement.name}-value`)).toHaveText("[0]", {
			timeout: 5000,
		})
		await expect(page.getByText(animalElement.name)).toHaveCount(1, { timeout: 5000 })
		const animalValue = page.getByTestId(`${animalElement.name}-value`)
		await expect(animalValue.getByText("cats")).toHaveCount(1, { timeout: 5000 })
		await expect(animalValue.getByText("otters")).toHaveCount(1, { timeout: 5000 })

		await expect(page.getByText(fruitElement.name)).toHaveCount(1)
		await expect(page.getByTestId(`${fruitElement.name}-value`)).toHaveText("mangos", {
			timeout: 5000,
		})
	})
})

test.describe("Rich text editor", () => {
	test("Can edit a rich text field", async () => {
		// Add rich text field
		const fieldsPage = new FieldsPage(page, community.community.slug)
		await fieldsPage.goto()
		await fieldsPage.addField("Rich text", CoreSchemaType.RichText)

		// Add a new form
		const formsPage = new FormsPage(page, community.community.slug)
		formsPage.goto()
		await page.waitForURL(`/c/${community.community.slug}/forms`)
		const formSlug = "rich-text-test"
		await formsPage.addForm("Rich text test", formSlug)

		await page.waitForURL(`/c/${community.community.slug}/forms/${formSlug}/edit`)

		// Add to existing form
		const formEditPage = new FormsEditPage(page, community.community.slug, formSlug)
		await formEditPage.goto()
		await formEditPage.openAddForm()

		// Add rich text field to form
		await formEditPage.openFormElementPanel(`${community.community.slug}:rich-text`)
		// Save the form builder and go to external form
		await formEditPage.saveForm()
		await formEditPage.goToExternalForm()

		// Fill out the form
		const actualTitle = "rich text title"
		await page.getByTestId(`${community.community.slug}:title`).fill("form title")
		await page.getByTestId(`${community.community.slug}:content`).fill("content")
		// Rich text field
		await page.locator(".ProseMirror").click()
		await page.keyboard.type("@title")
		await page.keyboard.press("Enter")
		await page.keyboard.type(actualTitle)
		await page.getByRole("button", { name: "Submit" }).click()
		await page.getByText("Form Successfully Submitted", { exact: true }).waitFor()

		// Check the pub page to make sure the values we expect are there
		await page.goto(`/c/${community.community.slug}/pubs`)
		await expect(page.getByRole("link", { name: actualTitle, exact: true })).toHaveCount(1, {
			timeout: 5000,
		})
	})
})

test.describe("Member select", async () => {
	test("Can select a member", async () => {
		const fieldsPage = new FieldsPage(page, community.community.slug)
		await fieldsPage.goto()
		await fieldsPage.addField("member", CoreSchemaType.MemberId)

		// Add these to a new form
		const formSlug = "member-form"
		const formsPage = new FormsPage(page, community.community.slug)
		await formsPage.goto()
		await formsPage.addForm("member form", formSlug)
		const formEditPage = new FormsEditPage(page, community.community.slug, formSlug)
		await formEditPage.goto()

		// Add the member field
		await formEditPage.openAddForm()
		await formEditPage.openFormElementPanel(`${community.community.slug}:member`)
		await page.getByRole("textbox", { name: "Label" }).first().fill("Member")
		await formEditPage.saveFormElementConfiguration()

		// Save the form builder and go to external form
		await formEditPage.saveForm()
		await formEditPage.goToExternalForm()

		const memberInput = page.getByTestId(`autocomplete-${community.community.slug}:member`)
		await expect(memberInput).toHaveCount(1)

		// Filling out an email should make the user show up in the dropdown
		const title = "member test"
		await page.getByTestId(`${community.community.slug}:title`).fill(title)
		await page.getByTestId(`${community.community.slug}:content`).fill("content")
		await memberInput.fill(community.users.user2.email)
		await page.getByLabel(community.users.user2.email).click()
		await expect(memberInput).toHaveValue(community.users.user2.email)

		// Switch to a different user
		await memberInput.clear()
		await memberInput.pressSequentially(community.users.user3.email)
		await page.getByLabel(community.users.user3.email).click()
		await expect(memberInput).toHaveValue(community.users.user3.email)

		// Add a new user
		const newUser = faker.internet.email()
		await memberInput.clear()
		await memberInput.pressSequentially(newUser)
		await page.getByTestId("member-select-add-button").click()
		await page.getByLabel("First name").fill(faker.person.firstName())
		await page.getByLabel("Last Name").fill(faker.person.lastName())
		await page.getByLabel("Suggestions").getByRole("button", { name: "Submit" }).click()
		await page.getByText("User invited", { exact: true }).waitFor({ timeout: 5000 })
		await page.getByLabel(newUser).click()
		await expect(memberInput).toHaveValue(newUser)

		// Save
		await page.getByRole("button", { name: "Submit" }).click()
		await page.getByText("Form Successfully Submitted", { exact: true }).waitFor()
	})
})

test.describe("Related pubs", () => {
	test("Can add related pubs", async () => {
		/**
		 * can be long
		 */
		test.setTimeout(60_000)
		// Create a related pub we can link to
		const relatedPubTitle = "related pub"
		const pubsPage = new PubsPage(page, community.community.slug)
		await pubsPage.goTo()
		await pubsPage.createPub({
			values: { title: relatedPubTitle, content: "my content" },
		})

		const fieldsPage = new FieldsPage(page, community.community.slug)
		await fieldsPage.goto()
		// Add a string, string array, and null related field
		const relatedFields = [
			{ name: "string", schemaName: CoreSchemaType.String },
			{ name: "array", schemaName: CoreSchemaType.StringArray },
			{ name: "null", schemaName: CoreSchemaType.Null },
		]
		for (const relatedField of relatedFields) {
			await fieldsPage.addField(relatedField.name, relatedField.schemaName, true)
		}
		// Add these to a new form
		const formSlug = "relationship-form"
		const formsPage = new FormsPage(page, community.community.slug)
		await formsPage.goto()
		await formsPage.addForm("relationship form", formSlug)
		const formEditPage = new FormsEditPage(page, community.community.slug, formSlug)
		await formEditPage.goto()

		// Configure these 3 fields
		for (const relatedField of relatedFields) {
			await formEditPage.openAddForm()
			await formEditPage.openFormElementPanel(
				`${community.community.slug}:${relatedField.name}`
			)
			await page.getByRole("textbox", { name: "Label" }).first().fill(relatedField.name)
			await page.getByRole("button", { name: "Select a pub type" }).click()
			// select all pubtypes
			await page.getByRole("group").getByText(community.pubTypes.Submission.name).click()
			await page.getByRole("group").getByText(community.pubTypes.Evaluation.name).click()
			await formEditPage.saveFormElementConfiguration()
		}

		// Save the form builder and go to external form
		await formEditPage.saveForm()
		await formEditPage.goToExternalForm()

		for (const element of relatedFields) {
			await expect(page.getByText(element.name)).toHaveCount(1)
		}

		// Fill out the form
		const title = "pub with related fields"
		await page.getByTestId(`${community.community.slug}:title`).fill(title)
		await page.getByTestId(`${community.community.slug}:content`).fill("content")
		// string related field
		const stringRelated = page.getByTestId("related-pubs-string")
		await stringRelated.getByRole("button", { name: "Add" }).click()
		await page.getByTestId("form-pub-search-select-input").fill(relatedPubTitle)
		await page.waitForTimeout(1_000)
		await page
			.getByRole("checkbox", { name: `Select pub` })
			// .getByLabel("Select row")
			.click({
				timeout: 10_000,
			})
		await page.getByTestId("add-related-pub-button").click()
		await expect(stringRelated.getByText(relatedPubTitle)).toHaveCount(1)
		await stringRelated.getByRole("button", { name: "Add string" }).click()
		await page.getByTestId(`${community.community.slug}:string.0.value`).fill("admin")
		// Click the button again (which now has the edited value) to 'exit' the popover
		await stringRelated.getByRole("button", { name: "admin" }).click()
		await expect(stringRelated.getByText("admin")).toHaveCount(1)

		// array related field
		const arrayRelated = page.getByTestId("related-pubs-array")
		await arrayRelated.getByRole("button", { name: "Add" }).click()
		await page.getByTestId("form-pub-search-select-input").fill(relatedPubTitle)
		await page.waitForTimeout(1_000)
		await page.getByRole("checkbox", { name: `Select pub` }).click()
		await page.getByTestId("add-related-pub-button").click()
		await expect(arrayRelated.getByText(relatedPubTitle)).toHaveCount(1)
		await arrayRelated.getByRole("button", { name: "Add array" }).click()
		const locator = page.getByTestId(`multivalue-input`)
		/**
		 * Use 'press' to trigger the ',' keyboard event, which "adds" the value
		 * Could also use 'Enter', but this seems to trigger submitting the form when run thru playwright
		 */
		await locator.fill("one")
		await locator.press(",")
		await locator.fill("two")
		await locator.press(",")
		// Click the button again to 'exit' the popover
		await arrayRelated.getByRole("button", { name: "one,two" }).click()
		await expect(arrayRelated.getByText("one,two")).toHaveCount(1)

		// null related field
		const nullRelated = page.getByTestId("related-pubs-null")
		await nullRelated.getByRole("button", { name: "Add" }).click()
		await page.getByTestId("form-pub-search-select-input").fill(relatedPubTitle)
		await page.waitForTimeout(400)
		await page.getByRole("checkbox", { name: `Select pub` }).click({
			timeout: 10_000,
		})
		await page.getByTestId("add-related-pub-button").click()
		await expect(nullRelated.getByText(relatedPubTitle)).toHaveCount(1)
		// Can't add a value to a null related field
		await expect(nullRelated.getByTestId("add-related-value")).toHaveCount(0)
		await page.getByRole("button", { name: "Submit" }).click()
		await page.getByText("Form Successfully Submitted").waitFor()

		// Check the pub page to make sure the values we expect are there
		await page.goto(`/c/${community.community.slug}/pubs`)
		await retryAction(async () => {
			await page.getByRole("link", { name: title, exact: true }).click({})
			await page.waitForURL(`/c/${community.community.slug}/pubs/*`, { timeout: 5000 })
		})
		// Make sure pub details page has loaded before making assertions
		await page.getByTestId("string-value").getByText("admin").waitFor()
		await page.getByTestId(`null-value`).getByText("related pub").waitFor()
	})
})
