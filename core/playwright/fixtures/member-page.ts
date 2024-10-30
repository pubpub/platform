import type { Page } from "@playwright/test";

import { faker } from "@faker-js/faker";

import { MemberRole } from "db/public";

export class MembersPage {
	private readonly communitySlug: string;

	constructor(
		public readonly page: Page,
		communitySlug: string
	) {
		this.communitySlug = communitySlug;
	}

	async goto() {
		await this.page.goto(`/c/${this.communitySlug}/members`);
	}

	async searchMembers(email: string) {
		await this.page.getByPlaceholder("Search table by email").fill(email);
	}

	async addNewUser(
		email = faker.internet.email(),
		{
			firstName = faker.person.firstName(),
			lastName = faker.person.lastName(),
			isSuperAdmin = false,
			role = MemberRole.editor,
		}: {
			firstName: string;
			lastName: string;
			isSuperAdmin: boolean;
			role: MemberRole;
		} = {
			firstName: faker.person.firstName(),
			lastName: faker.person.lastName(),
			isSuperAdmin: false,
			role: MemberRole.editor,
		}
	) {
		// await this.page.goto(`/c/${this.communitySlug}/members/add`);
		await this.page.getByText(/Add Member/).click();
		const addMemberDialog = this.page.getByRole("dialog", { name: "Add Member" });
		await addMemberDialog.getByLabel("Email").fill(email);

		await this.page.locator('input[name="firstName"]').fill(firstName);
		await this.page.locator('input[name="lastName"]').fill(lastName);
		if (isSuperAdmin) {
			await this.page.getByLabel("Make user superadmin").click();
		}

		await this.page.getByLabel("Role").click();
		await this.page.getByLabel(role[0].toUpperCase() + role.slice(1)).click();

		await this.page.getByRole("button", { name: "Invite" }).click();

		await this.page.getByText("User successfully invited", { exact: true }).waitFor();
		await addMemberDialog.waitFor({ state: "hidden" });

		return {
			email,
			firstName,
			lastName,
			isSuperAdmin,
			role,
		};
	}

	async addExistingUser(email: string, role = MemberRole.editor) {
		await this.page.goto(`/c/${this.communitySlug}/members/add`);
		const addMemberDialog = this.page.getByRole("dialog", { name: "Add Member" });

		await addMemberDialog.getByLabel("Email").fill(email);

		await this.page.getByLabel("Role").click();
		await this.page.getByLabel(role[0].toUpperCase() + role.slice(1)).click();
		await this.page.getByRole("button", { name: "Add Member" }).click({
			timeout: 100,
		});

		await this.page.getByText("Member added successfully", { exact: true }).waitFor();
		await addMemberDialog.waitFor({ state: "hidden" });
	}

	async removeMember(email: string) {
		await this.searchMembers(email);
		await this.page.getByRole("button", { name: "Open menu", exact: true }).click();
		await this.page.getByRole("button", { name: "Remove member", exact: true }).click();
		await this.page.getByRole("button", { name: "Remove", exact: true }).click();
	}
}
