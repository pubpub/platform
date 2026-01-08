import type { Page } from "@playwright/test"

import { faker } from "@faker-js/faker"

import { MemberRole } from "db/public"

import { AddMemberDialog } from "./member-dialog"

export class MembersPage {
	private readonly communitySlug: string

	constructor(
		public readonly page: Page,
		communitySlug: string
	) {
		this.communitySlug = communitySlug
	}

	async goto() {
		await this.page.goto(`/c/${this.communitySlug}/members`)
	}

	async searchMembers(email: string) {
		await this.page.getByPlaceholder("Search by name or email...").pressSequentially(email)
	}

	async openAddMemberDialog() {
		await this.page.getByText(/Add Member/).click()
		const addMemberDialog = this.page.getByRole("dialog", { name: "Add Member" })
		await addMemberDialog.waitFor()
		return new AddMemberDialog(this.page, addMemberDialog)
	}

	async addNewUser(
		email = faker.internet.email(),
		{
			firstName = faker.person.firstName(),
			lastName = faker.person.lastName(),
			isSuperAdmin = false,
			role = MemberRole.editor,
			forms = [],
		}: {
			firstName: string
			lastName: string
			isSuperAdmin: boolean
			role: MemberRole
			forms: string[]
		} = {
			firstName: faker.person.firstName(),
			lastName: faker.person.lastName(),
			isSuperAdmin: false,
			role: MemberRole.editor,
			forms: [],
		}
	) {
		const addMemberDialog = await this.openAddMemberDialog()
		return await addMemberDialog.addNewUser(email, {
			firstName,
			lastName,
			isSuperAdmin,
			role,
			forms,
		})
	}

	/**
	 * @param forms An array of form names to add to this membership
	 */
	async addExistingUser(email: string, role = MemberRole.editor, forms: string[] = []) {
		const addMemberDialog = await this.openAddMemberDialog()
		return await addMemberDialog.addExistingUser(email, role, forms)
	}

	async removeMember(email: string) {
		await this.searchMembers(email)
		await this.page.getByRole("button", { name: "Remove member", exact: true }).click()
		// await this.page.getByRole("button", { name: "Remove member", exact: true }).click()
		// await this.page.getByRole("button", { name: "Remove", exact: true }).click()
		await this.page.getByText("Member removed", { exact: true }).waitFor()
	}
}
